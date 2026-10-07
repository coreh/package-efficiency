// Where each ecosystem's package list and categorization live. npm was the
// first and keeps its files directly under data/; the others get a folder.
const ECOSYSTEMS = {
  npm: { title: 'npm', registry: 'npmjs.org', sort: 'downloads', popularity: 'downloads per month' },
  cargo: { title: 'crates.io', registry: 'crates.io', sort: 'downloads', popularity: 'downloads in total' },
  pypi: { title: 'PyPI', registry: 'pypi.org', sort: 'downloads', popularity: 'downloads per month' },
  rubygems: { title: 'RubyGems', registry: 'rubygems.org', sort: 'downloads', popularity: 'downloads in total' },
  // The Go module proxy publishes no download counts, so Go modules are ranked
  // by how many repositories depend on them.
  gomod: { title: 'Go modules', registry: 'proxy.golang.org', sort: 'dependent_repos_count', popularity: 'repositories that depend on it' },
  // Read from the JSR registry itself; see fetch-top.mjs.
  jsr: { title: 'JSR', registry: null, sort: 'downloads', popularity: 'downloads in the last 90 days' },
}

export const ecosystemIds = Object.keys(ECOSYSTEMS)

export function ecosystem(id) {
  const config = ECOSYSTEMS[id]
  if (!config) throw new Error(`unknown ecosystem "${id}"; expected one of ${ecosystemIds.join(', ')}`)
  const dir = id === 'npm' ? 'data' : `data/${id}`
  return {
    id,
    ...config,
    dir,
    packages: `${dir}/packages.json`,
    // Packages added by hand, outside the most used: same shape, no rank.
    picked: `${dir}/picked.json`,
    packagesTsv: `${dir}/packages.tsv`,
    categories: `${dir}/categories.json`,
    report: `${dir}/categories.md`,
    batches: `${dir}/batches`,
  }
}

// `--ecosystem=cargo` on a script's command line; npm when absent.
export const ecosystemFromArgs = (argv = process.argv.slice(2)) => ecosystem(argv.find((a) => a.startsWith('--ecosystem='))?.split('=')[1] ?? 'npm')

// A Go module is listed and linked by its path, and measured under a short
// name: the folder of its adapters and the last part of its address on the
// site. The name follows from the path, so every task gives a module the same
// one: the path without its major-version suffix (/v5, .v3), without the host
// when that is github.com, lower-cased, with "-" for "/".
//   github.com/goccy/go-json    goccy-go-json
//   github.com/go-chi/chi/v5    go-chi-chi
//   golang.org/x/text           golang.org-x-text
//   gopkg.in/yaml.v3            gopkg.in-yaml
// (The HTTP servers and web frameworks measured before this rule keep their
// names: chi, gin, echo, fiber. Their adapter.json names the module too.)
export const goFamily = (modulePath) => modulePath.replace(/\/v\d+$/, '').replace(/\.v\d+$/, '')
export function goPackageName(modulePath) {
  const parts = goFamily(modulePath).split('/')
  return (parts[0] === 'github.com' && parts.length > 1 ? parts.slice(1) : parts).join('-').toLowerCase().replace(/[^a-z0-9._-]/g, '-')
}
