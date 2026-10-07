"""Resolve PyPI packages, and everything they require, to exact wheel files
for one interpreter. Run by scripts/lib/native-packages.mjs under CPython;
reads a request as JSON on standard input and prints the answer as JSON.
Nothing is downloaded but registry metadata (the PyPI JSON API).

Request:
  roots        names of the packages asked for
  pins         name -> version: binding for a root, preferred for anything else
  environment  the PEP 508 marker values of the interpreter the wheels are for
  pure         true: only pure-Python wheels (py3-none-any) may be chosen, for
               an interpreter that is not the CPython running this script
  minAgeDays   a release counts only when every one of its files was uploaded
               at least this many days ago and none is yanked

Answer: {"packages": [{name, version, file, sha256, published, compiled,
requires}]} or {"unavailable": "<why>"} when `pure` is asked for and a
package has no pure-Python wheel. Any other problem is an error (exit 1).

Version, specifier, marker and wheel-tag rules are pip's own (its bundled
`packaging`). Only wheels are ever chosen: a release with nothing but a source
distribution is passed over, because building one runs the package's code.
The resolution takes the newest eligible version that satisfies what has been
required so far and starts over when a later requirement rules a choice out;
it does not search further back than that."""
import datetime
import json
import sys
import urllib.error
import urllib.request

from pip._vendor.packaging import tags as tagging
from pip._vendor.packaging.requirements import Requirement
from pip._vendor.packaging.specifiers import SpecifierSet
from pip._vendor.packaging.utils import canonicalize_name, parse_wheel_filename
from pip._vendor.packaging.version import InvalidVersion, Version

request = json.load(sys.stdin)
environment = request['environment']
pure_only = request['pure']
python = Version(environment['python_full_version'])
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=request['minAgeDays'])
pins = {canonicalize_name(name): version for name, version in request.get('pins', {}).items()}
roots = [canonicalize_name(name) for name in request['roots']]
# Best first, as pip ranks them.
supported = {} if pure_only else {tag: rank for rank, tag in enumerate(tagging.sys_tags())}


class Unavailable(Exception):
    pass


def fetch(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'Accept': 'application/json'}), timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise SystemExit(f'PyPI: {url}: {error.code}')


def is_pure(tag):
    if tag.abi != 'none' or tag.platform != 'any':
        return False
    if tag.interpreter == 'py3':
        return True
    return tag.interpreter.startswith('py3') and tag.interpreter[3:].isdigit() and int(tag.interpreter[3:]) <= python.minor


def wheel_rank(filename):
    """How well a wheel fits, lower is better; None when it cannot be used."""
    try:
        _, _, _, wheel_tags = parse_wheel_filename(filename)
    except Exception:
        return None
    if pure_only:
        return 0 if any(is_pure(tag) for tag in wheel_tags) else None
    ranks = [supported[tag] for tag in wheel_tags if tag in supported]
    return min(ranks) if ranks else None


def uploaded(file):
    return datetime.datetime.fromisoformat(file['upload_time_iso_8601'].replace('Z', '+00:00'))


releases_of = {}


def releases(name):
    if name not in releases_of:
        found = []
        for text, files in fetch(f'https://pypi.org/pypi/{name}/json')['releases'].items():
            try:
                version = Version(text)
            except InvalidVersion:
                continue
            found.append((version, text, files))
        releases_of[name] = sorted(found, key=lambda release: release[0], reverse=True)
    return releases_of[name]


def choose(name, constraint, is_root):
    """The release of `name` to install and its wheel."""
    pinned = pins.get(name)
    candidates = releases(name)
    if pinned:
        first = [release for release in candidates if release[1] == pinned]
        if is_root:
            if not first:
                raise SystemExit(f'{name} is pinned at {pinned}, which PyPI does not list')
            candidates = first
        else:
            candidates = first + [release for release in candidates if release[1] != pinned]
    no_pure = None
    for version, text, files in candidates:
        if version.is_prerelease or version.is_devrelease or not constraint.contains(version, prereleases=True):
            continue
        if not files or any(file.get('yanked') for file in files) or any(uploaded(file) > cutoff for file in files):
            if pinned == text and is_root:
                raise SystemExit(f'{name} {text} is pinned but not eligible: yanked, or a file of it is less than {request["minAgeDays"]} days old')
            continue
        wheels = []
        for file in files:
            if file['packagetype'] != 'bdist_wheel':
                continue
            wanted = file.get('requires_python')
            try:
                if wanted and not SpecifierSet(wanted).contains(python, prereleases=True):
                    continue
            except Exception:
                continue
            rank = wheel_rank(file['filename'])
            if rank is not None:
                wheels.append((rank, file['filename'], file))
        if wheels:
            return text, min(wheels)[2]
        if pure_only and any(file['packagetype'] == 'bdist_wheel' for file in files):
            no_pure = no_pure or text
            if pinned == text and is_root:
                break
        elif pinned == text and is_root:
            raise SystemExit(f'{name} {text} has no wheel for this Python and platform (a source distribution is never built)')
    if pure_only and no_pure:
        raise Unavailable(f'{name} {no_pure} has no pure-Python wheel (py3-none-any): its wheels hold compiled code for other interpreters')
    raise SystemExit(f'no eligible release of {name} satisfies "{constraint}" with a wheel for this Python and platform (releases at least {request["minAgeDays"]} days old, not yanked; a source distribution is never built)')


def requirements(name, version, extras):
    found = []
    for line in fetch(f'https://pypi.org/pypi/{name}/{version}/json')['info'].get('requires_dist') or []:
        requirement = Requirement(line)
        if requirement.url:
            raise SystemExit(f'{name} {version} requires {requirement.name} from a URL, which is not installed')
        marker = requirement.marker
        if marker and not any(marker.evaluate({**environment, 'extra': extra}) for extra in ['', *sorted(extras)]):
            continue
        found.append(requirement)
    return found


constraints = {}
extras_of = {}


def attempt():
    """One walk from the roots. False when a choice made earlier in the walk
    was ruled out later; the constraint is kept and the walk starts over."""
    chosen = {}
    pending = list(roots)
    consistent = True
    while pending:
        name = pending.pop(0)
        if name in chosen:
            continue
        version, file = choose(name, constraints.get(name, SpecifierSet()), name in roots)
        needs = requirements(name, version, extras_of.get(name, set()))
        chosen[name] = {'version': version, 'file': file, 'requires': sorted({canonicalize_name(r.name) for r in needs})}
        for requirement in needs:
            dependency = canonicalize_name(requirement.name)
            before = (str(constraints.get(dependency, SpecifierSet())), frozenset(extras_of.get(dependency, set())))
            constraints[dependency] = constraints.get(dependency, SpecifierSet()) & requirement.specifier
            extras_of.setdefault(dependency, set()).update(requirement.extras)
            changed = before != (str(constraints[dependency]), frozenset(extras_of[dependency]))
            if dependency in chosen and changed:
                consistent = False
            pending.append(dependency)
    return chosen if consistent else None


try:
    chosen = None
    for _ in range(25):
        chosen = attempt()
        if chosen is not None:
            break
    if chosen is None:
        raise SystemExit('the requirements of these packages did not settle on one set of versions')
except Unavailable as reason:
    print(json.dumps({'unavailable': str(reason)}))
    sys.exit(0)

packages = []
for name in sorted(chosen):
    entry = chosen[name]
    file = entry['file']
    _, _, _, wheel_tags = parse_wheel_filename(file['filename'])
    packages.append({
        'name': name,
        'version': entry['version'],
        'file': file['filename'],
        'sha256': file['digests']['sha256'],
        'published': file['upload_time_iso_8601'][:10],
        # Holds compiled code: a prebuilt binary for this platform, not built here.
        'compiled': not all(tag.abi == 'none' and tag.platform == 'any' for tag in wheel_tags),
        'requires': entry['requires'],
    })
print(json.dumps({'packages': packages}))
