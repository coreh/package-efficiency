// Fetch the license and the release dates of every listed package, into one
// metadata.json per ecosystem (data/metadata.json for npm,
// data/<ecosystem>/metadata.json for the others):
//   { fetchedAt, packages: { <name>: { version, license, licenseSource, releasedAt, firstReleasedAt } } }
// license          an SPDX expression where the registry gives one, null when
//                  it does not. Common spellings are brought to their SPDX
//                  form with the table below; anything else short is kept as
//                  the registry has it ("BSD", "GPL-3.0": nothing is guessed),
//                  and a whole license text is dropped.
// licenseSource    "registry", or "repository" for Go modules: Go has no
//                  registry field, so the license GitHub detects in the
//                  module's repository is used (needs GITHUB_TOKEN, GH_TOKEN
//                  or a signed-in gh; Go licenses stay null without one).
// releasedAt       when the listed version was published.
// firstReleasedAt  when the package's first version was published. For a Go
//                  module this is the lowest tagged version the proxy knows,
//                  of the module or of its earlier major versions' path.
// version          the listed version the entry was read for; an entry is
//                  fetched again when the listed version has moved on.
// Only registry metadata is read; no archive is downloaded and nothing is
// installed. Packages already in the output are skipped, so a run that was
// interrupted carries on where it stopped; entries that failed are tried again.
// Usage: node scripts/fetch-metadata.mjs [--only=npm|cargo|pypi|rubygems|gomod|jsr] [--force]
import { execFileSync } from 'node:child_process'
import { ecosystem, ecosystemIds } from './lib/ecosystems.mjs'
import { fromRoot, readJson, writeJson } from './lib/util.mjs'

const args = process.argv.slice(2)
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]
const force = args.includes('--force')
const USER_AGENT = 'package-efficiency.org metadata fetch (https://github.com/coreh/package-efficiency)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// At most one request per `ms` to a host that asks for it (crates.io: 1/s).
const gates = new Map()
function gate(host, ms) {
  const at = Math.max(Date.now(), (gates.get(host) ?? 0) + ms)
  gates.set(host, at)
  return sleep(at - Date.now())
}
const INTERVAL = { 'crates.io': 1050, 'rubygems.org': 150 }

// JSON (or text) of a URL; null when it does not exist. 429 and 5xx are tried
// again, after the time the server asks for when it names one.
async function get(url, { text = false, headers = {} } = {}) {
  const host = new URL(url).host
  for (let attempt = 1; ; attempt++) {
    if (INTERVAL[host]) await gate(host, INTERVAL[host])
    const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, ...headers } }).catch(() => null)
    if (res?.ok) return text ? res.text() : res.json()
    if (res && [404, 410].includes(res.status)) return null
    const retry = !res || res.status === 429 || res.status >= 500 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')
    if (!retry || attempt === 6) throw new Error(`${url} -> ${res ? `HTTP ${res.status}` : 'no response'}`)
    const wait = Number(res?.headers.get('retry-after')) * 1000
    await sleep(wait > 0 && wait <= 120000 ? wait : 3000 * attempt)
  }
}

async function pooled(items, limit, task) {
  let next = 0
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) await task(items[next++])
  }))
}

const iso = (time) => (time && !Number.isNaN(Date.parse(time)) ? new Date(time).toISOString() : null)
const earliest = (times) => times.map(iso).filter(Boolean).sort()[0] ?? null

// Spellings registries carry for a license, by their SPDX identifier. Only
// what is listed here is rewritten; "BSD" and the like, which name no one
// license, stay as they are.
const SPELLINGS = {
  'MIT': ['mit license', 'the mit license', 'the mit license (mit)', 'mit licence', 'mit-license', 'expat', 'expat license'],
  'Apache-2.0': ['apache 2.0', 'apache-2', 'apache 2', 'apache2', 'apache2.0', 'apache v2', 'apache v2.0', 'apache license 2.0', 'apache license, version 2.0', 'apache license version 2.0', 'apache license v2.0', 'apache software license 2.0', 'apache software license', 'apache-2.0 license', 'apache 2.0 license', 'apache license (2.0)', 'the apache license, version 2.0', 'the apache software license, version 2.0', 'asl 2.0', 'apache license 2', 'apache license, 2.0', 'apache 2.0 licence'],
  'BSD-3-Clause': ['bsd 3-clause', 'bsd-3', 'bsd 3 clause', '3-clause bsd', '3-clause bsd license', 'bsd 3-clause license', 'bsd-3-clause license', 'new bsd', 'new bsd license', 'modified bsd license', 'bsd 3-clause "new" or "revised" license'],
  'BSD-2-Clause': ['bsd 2-clause', 'bsd-2', 'bsd 2 clause', '2-clause bsd', 'bsd 2-clause license', 'bsd-2-clause license', 'simplified bsd', 'simplified bsd license'],
  'ISC': ['isc license', 'isc license (iscl)'],
  'MPL-2.0': ['mpl 2.0', 'mpl2', 'mpl-2', 'mozilla public license 2.0', 'mozilla public license 2.0 (mpl 2.0)', 'mozilla public license, v. 2.0', 'mozilla public license version 2.0'],
  'Unlicense': ['unlicense', 'the unlicense', 'the unlicense (unlicense)'],
  'CC0-1.0': ['cc0', 'cc0 1.0', 'cc0-1.0 universal', 'cc0 1.0 universal'],
  'PSF-2.0': ['psf-2.0', 'python software foundation license', 'psf license'],
  'Zlib': ['zlib', 'zlib license', 'zlib/libpng'],
  '0BSD': ['0bsd', 'bsd zero clause license', 'zero-clause bsd'],
  'HPND': ['hpnd', 'historical permission notice and disclaimer (hpnd)'],
  'WTFPL': ['wtfpl'],
  'Ruby': ['ruby', "ruby's", 'ruby license'],
  'Artistic-2.0': ['artistic 2.0', 'artistic license 2.0'],
  'BSL-1.0': ['boost software license 1.0', 'boost software license 1.0 (bsl-1.0)', 'boost software license - version 1.0'],
}
const SPDX_OF = new Map(Object.entries(SPELLINGS).flatMap(([id, names]) => [[id.toLowerCase(), id], ...names.map((n) => [n, id])]))

// PyPI's trove classifiers, where each names one license.
const CLASSIFIERS = {
  'MIT License': 'MIT', 'MIT No Attribution License (MIT-0)': 'MIT-0', 'Apache Software License': 'Apache-2.0', 'BSD License': 'BSD',
  'ISC License (ISCL)': 'ISC', 'Mozilla Public License 2.0 (MPL 2.0)': 'MPL-2.0', 'Mozilla Public License 1.1 (MPL 1.1)': 'MPL-1.1',
  'Python Software Foundation License': 'PSF-2.0', 'The Unlicense (Unlicense)': 'Unlicense', 'CC0 1.0 Universal (CC0 1.0) Public Domain Dedication': 'CC0-1.0',
  'GNU General Public License v2 (GPLv2)': 'GPL-2.0-only', 'GNU General Public License v2 or later (GPLv2+)': 'GPL-2.0-or-later',
  'GNU General Public License v3 (GPLv3)': 'GPL-3.0-only', 'GNU General Public License v3 or later (GPLv3+)': 'GPL-3.0-or-later',
  'GNU Lesser General Public License v2 (LGPLv2)': 'LGPL-2.0-only', 'GNU Lesser General Public License v2 or later (LGPLv2+)': 'LGPL-2.0-or-later',
  'GNU Lesser General Public License v3 (LGPLv3)': 'LGPL-3.0-only', 'GNU Lesser General Public License v3 or later (LGPLv3+)': 'LGPL-3.0-or-later',
  'GNU Affero General Public License v3': 'AGPL-3.0-only', 'GNU Affero General Public License v3 or later (AGPLv3+)': 'AGPL-3.0-or-later',
  'GNU General Public License (GPL)': 'GPL', 'GNU Library or Lesser General Public License (LGPL)': 'LGPL',
  'Zope Public License': 'ZPL', 'Boost Software License 1.0 (BSL-1.0)': 'BSL-1.0', 'Historical Permission Notice and Disclaimer (HPND)': 'HPND',
  'Eclipse Public License 2.0 (EPL-2.0)': 'EPL-2.0', 'Eclipse Public License 1.0 (EPL-1.0)': 'EPL-1.0', 'Academic Free License (AFL)': 'AFL',
  'Artistic License': 'Artistic', 'zlib/libpng License': 'Zlib', 'Universal Permissive License (UPL)': 'UPL-1.0', 'Public Domain': 'Public Domain',
  'European Union Public Licence 1.2 (EUPL 1.2)': 'EUPL-1.2', 'SIL Open Font License 1.1 (OFL-1.1)': 'OFL-1.1',
}

// One license as a registry spells it -> the stored value, or null: empty,
// more than one line or longer than 100 characters (a license text, not a name).
function licenseOf(value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || text.length > 100 || /[\r\n]/.test(text)) return null
  if (/^(unknown|none|n\/a|see license|license|licence|other\/proprietary license)$/i.test(text) || /^see licen[sc]e in /i.test(text) || /^licen[sc]e(\.\w+)?$/i.test(text)) return null
  return SPDX_OF.get(text.toLowerCase().replace(/\s+/g, ' ')) ?? text
}
const joined = (values) => [...new Set(values.map(licenseOf).filter(Boolean))].join(' OR ') || null

const sources = {
  // The whole packument: the abbreviated one has no publish times.
  async npm(p) {
    const doc = await get(`https://registry.npmjs.org/${p.name.replace('/', '%2F')}`)
    if (!doc) throw new Error('not in the registry')
    const { created, modified, ...times } = doc.time ?? {}
    const manifest = doc.versions?.[p.version] ?? {}
    // `license` is a string; old manifests have { type } or a `licenses` list.
    const declared = manifest.license ?? manifest.licenses ?? doc.license
    const license = Array.isArray(declared) ? joined(declared.map((l) => l?.type ?? l)) : licenseOf(declared?.type ?? declared)
    return { license, releasedAt: iso(times[p.version]), firstReleasedAt: earliest(Object.values(times)) ?? iso(created) }
  },

  async jsr(p) {
    const [, scope, name] = /^@([^/]+)\/(.+)$/.exec(p.name)
    const [meta, version] = await Promise.all([get(`https://jsr.io/@${scope}/${name}/meta.json`), get(`https://api.jsr.io/scopes/${scope}/packages/${name}/versions/${encodeURIComponent(p.version)}`)])
    if (!meta && !version) throw new Error('not in the registry')
    // Some meta.json files list their versions without dates; the API's list has them.
    let times = Object.values(meta?.versions ?? {}).map((v) => v.createdAt)
    if (!times.some(Boolean)) times = ((await get(`https://api.jsr.io/scopes/${scope}/packages/${name}/versions`))?.items ?? []).map((v) => v.createdAt)
    return { license: licenseOf(version?.license), releasedAt: iso(meta?.versions?.[p.version]?.createdAt ?? version?.createdAt), firstReleasedAt: earliest(times) }
  },

  async pypi(p) {
    const doc = await get(`https://pypi.org/pypi/${encodeURIComponent(p.name)}/json`)
    if (!doc) throw new Error('not in the registry')
    // `info` is that of the newest release; the listed one is asked for when it differs.
    const info = doc.info.version === p.version ? doc.info : ((await get(`https://pypi.org/pypi/${encodeURIComponent(p.name)}/${encodeURIComponent(p.version)}/json`))?.info ?? {})
    const classified = [...new Set((info.classifiers ?? []).filter((c) => c.startsWith('License ::')).map((c) => CLASSIFIERS[c.split(' :: ').at(-1)]).filter(Boolean))]
    const license = licenseOf(info.license_expression) ?? (classified.length ? classified.join(' OR ') : null) ?? licenseOf(info.license)
    const uploaded = (files) => earliest((files ?? []).map((f) => f.upload_time_iso_8601))
    return { license, releasedAt: uploaded(doc.releases?.[p.version]), firstReleasedAt: earliest(Object.values(doc.releases ?? {}).map(uploaded)) }
  },

  async rubygems(p) {
    const versions = await get(`https://rubygems.org/api/v1/versions/${encodeURIComponent(p.name)}.json`)
    if (!versions) throw new Error('not in the registry')
    // A gem built per platform may be listed as <number>-<platform>.
    const listed = versions.filter((v) => v.number === p.version || `${v.number}-${v.platform}` === p.version)
    const version = listed.find((v) => v.platform === 'ruby') ?? listed[0]
    return { license: joined(version?.licenses ?? []), releasedAt: earliest(listed.map((v) => v.created_at)), firstReleasedAt: earliest(versions.map((v) => v.created_at)) }
  },

  // One request per crate, one per second (crates.io's crawler policy).
  async cargo(p) {
    const doc = await get(`https://crates.io/api/v1/crates/${encodeURIComponent(p.name)}`)
    if (!doc) throw new Error('not in the registry')
    const version = doc.versions?.find((v) => v.num === p.version)
    // Before SPDX expressions, crates wrote "MIT/Apache-2.0" for either.
    const license = typeof version?.license === 'string' ? joined(version.license.split('/')) : null
    return { license, releasedAt: iso(version?.created_at), firstReleasedAt: earliest([doc.crate?.created_at, ...(doc.versions ?? []).map((v) => v.created_at)]) }
  },

  async gomod(p) {
    const proxy = (path) => `https://proxy.golang.org/${path.replace(/[A-Z]/g, (c) => `!${c.toLowerCase()}`)}/@v`
    // A module listed without a version still has a license and a first version.
    const info = p.version ? await get(`${proxy(p.name)}/${p.version}.info`) : {}
    if (!info) throw new Error('not on the module proxy')
    // The module's first major versions live at another path: …/v5 began at
    // the path without the suffix, gopkg.in/x.v3 at gopkg.in/x.v1.
    const major = /^(.*?)(?:\/v|(\.v))(\d+)$/.exec(p.name)
    const paths = [p.name, ...(major && Number(major[3]) > 1 ? [major[2] ? `${major[1]}.v1` : major[1]] : [])]
    const firsts = await Promise.all(paths.map(async (path) => {
      // The list can name a tag the proxy no longer resolves; the next one is asked then.
      const tagged = ((await get(`${proxy(path)}/list`, { text: true })) ?? '').split('\n').filter((v) => /^v\d+\.\d+\.\d+/.test(v)).sort(compareVersions)
      for (const version of tagged.slice(0, 4)) {
        const time = (await get(`${proxy(path)}/${version}.info`))?.Time
        if (time) return time
      }
    }))
    return { ...(await repositoryLicense(p)), releasedAt: iso(info.Time), firstReleasedAt: earliest(firsts) }
  },
}

// Semantic version order, a release after its prereleases.
function compareVersions(a, b) {
  const parts = (v) => { const [core, pre] = v.replace(/^v/, '').replace(/\+.*$/, '').split(/-(.*)/); return { core: core.split('.').map(Number), pre } }
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < 3; i++) if ((x.core[i] ?? 0) !== (y.core[i] ?? 0)) return (x.core[i] ?? 0) - (y.core[i] ?? 0)
  if (x.pre === y.pre) return 0
  return x.pre === undefined ? 1 : y.pre === undefined ? -1 : x.pre.localeCompare(y.pre, 'en', { numeric: true })
}

// The token is read once, used only in the Authorization header to
// api.github.com, and never printed.
let githubToken
function github() {
  if (githubToken === undefined) {
    githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null
    if (!githubToken) try { githubToken = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null } catch { githubToken = null }
    if (!githubToken) console.error('no GitHub token (GITHUB_TOKEN, GH_TOKEN or gh): Go licenses are left empty')
  }
  return githubToken
}
const repositories = new Map()
async function repositoryLicense(p) {
  const repo = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?]|$)/.exec(p.repository ?? '') ?? /^github\.com\/([^/]+)\/([^/]+)/.exec(p.name)
  if (!repo || !github()) return { license: null, licenseSource: null }
  const key = `${repo[1]}/${repo[2]}`
  if (!repositories.has(key)) repositories.set(key, get(`https://api.github.com/repos/${key}/license`, { headers: { authorization: `Bearer ${github()}`, accept: 'application/vnd.github+json' } }))
  const id = (await repositories.get(key))?.license?.spdx_id
  const license = id && id !== 'NOASSERTION' ? id : null
  return { license, licenseSource: license ? 'repository' : null }
}

const CONCURRENCY = { cargo: 1, rubygems: 4 }

let flush = null
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await flush?.(); process.exit(130) })

for (const id of only ? [ecosystem(only).id] : ecosystemIds) {
  const eco = ecosystem(id)
  const listed = [...(await readJson(fromRoot(eco.packages), [])), ...(await readJson(fromRoot(eco.picked), []))]
  const file = fromRoot(eco.dir, 'metadata.json')
  const before = (await readJson(file, {})).packages ?? {}
  // Only listed packages are kept, in the order they are listed.
  const packages = {}
  const todo = []
  for (const p of listed) {
    const have = before[p.name]
    if (have && !have.error && have.version === (p.version ?? null) && !force) packages[p.name] = have
    else todo.push(p)
  }
  flush = () => writeJson(file, { fetchedAt: new Date().toISOString(), packages: Object.fromEntries(listed.filter((p) => packages[p.name]).map((p) => [p.name, packages[p.name]])) })
  let done = 0
  let failed = 0
  await pooled(todo, CONCURRENCY[id] ?? 8, async (p) => {
    try {
      const found = await sources[id](p)
      packages[p.name] = { version: p.version ?? null, license: found.license, licenseSource: found.licenseSource ?? (found.license ? 'registry' : null), releasedAt: found.releasedAt, firstReleasedAt: found.firstReleasedAt }
    } catch (error) {
      failed++
      packages[p.name] = { version: p.version ?? null, license: null, licenseSource: null, releasedAt: null, firstReleasedAt: null, error: String(error.message).slice(0, 200) }
    }
    if (++done % 50 === 0) {
      await flush()
      console.error(`${eco.title}: ${done}/${todo.length}`)
    }
  })
  await flush()
  const count = (field) => listed.filter((p) => packages[p.name]?.[field]).length
  console.log(`${eco.title}: ${listed.length} packages (${todo.length} fetched, ${failed} failed): license ${count('license')}, releasedAt ${count('releasedAt')}, firstReleasedAt ${count('firstReleasedAt')} -> ${eco.dir}/metadata.json`)
}
flush = null
