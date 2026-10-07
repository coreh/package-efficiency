// What the Go applications' prepare.mjs files share: the release-age check of
// their modules, the build, and how the built server is started.
//
// An application is a Go module in its own folder: go.mod and go.sum (the
// pinned versions and their checksums), app.go and the rest of its source,
// and templates/ which the server reads when it starts. It is built the way
// the Go servers of http-server/json-api are (scripts/lib/native-http.mjs):
// the harness's own runner, harness/go/http-runner.go, is compiled into it as
// its main function, with `go build -mod=readonly` and the module cache under
// .cache/. The source is copied to .cache/work/ and built there, so nothing
// is written into the application's folder but go.sum, once.
//
// The release-age rule is applied as scripts/setup-http-servers.mjs applies
// it: every module of the build list (`go list -m all`) must have been
// published at least seven days ago according to proxy.golang.org, or nothing
// is built. A go.mod with no go.sum beside it is resolved first, and checked
// before any source is downloaded.
//
// An application on net/http gives `func handler() http.Handler` and is
// served by the runner as it is. One with a server of its own (Fiber, on
// fasthttp) gives `func serve(net.Listener) error` instead, and the same
// runner is compiled with its one call to net/http's server replaced by a
// call to that function: the protocol code is still the harness's.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const MIN_AGE_MS = 7 * 864e5
const BASE_ADAPTER = 'package main\nimport "net/http"\nfunc handler() http.Handler { return nil }\n'

// The harness runner with its net/http server replaced by the application's
// own `serve`. Each replacement must be found exactly once, so a change to
// the runner is noticed here instead of building something else.
function runnerWithOwnServer(source) {
  const replace = (text, from, to) => {
    if (text.split(from).length !== 2) throw new Error(`harness/go/http-runner.go no longer has "${from}" exactly once`)
    return text.replace(from, to)
  }
  return replace(replace(source, 'server=&http.Server{Handler:handler()}', 'server=&http.Server{}'), 'server.Serve(listener);err!=nil && err!=http.ErrServerClosed', 'serve(listener);err!=nil')
}

// Every module of the build list must be at least seven days old.
async function checkAges(modules) {
  const cutoff = Date.now() - MIN_AGE_MS
  await Promise.all(modules.filter((module) => !module.Main).map(async (module) => {
    if (!module.Version || module.Replace) throw new Error(`Ineligible module ${module.Path}: not a published release`)
    const escaped = module.Path.replace(/[A-Z]/g, (c) => `!${c.toLowerCase()}`)
    const response = await fetch(`https://proxy.golang.org/${escaped}/@v/${module.Version}.info`)
    if (!response.ok) throw new Error(`proxy.golang.org has no ${module.Path}@${module.Version} (${response.status})`)
    const info = await response.json()
    if (!info.Time || !(Date.parse(info.Time) <= cutoff)) throw new Error(`Ineligible module ${module.Path}@${module.Version}: less than seven days old`)
  }))
}

// `here` is the application's folder; `module` the path of the framework's
// module, or null for the standard library alone; `ownServer` says the
// application serves the listener itself (see above).
export async function prepareGoApp({ here, module = null, ownServer = false, root, runtime, helpers }) {
  const registry = module ? 'gomod' : 'builtin'
  const name = path.basename(here)
  const work = helpers.fromRoot('.cache/work/web-application-frameworks', registry, name)
  const binary = path.join(work, 'server')
  const baseDir = helpers.fromRoot('.cache/work/go-http-baseline')
  const baseBinary = path.join(baseDir, 'runner')
  const record = path.join(work, 'build.json')
  const env = { ...process.env, GOCACHE: helpers.fromRoot('.cache/go-build'), GOPATH: helpers.fromRoot('.cache/go-path'), GOMODCACHE: helpers.fromRoot('.cache/go-mod'), GOTOOLCHAIN: 'local', GOFLAGS: '' }
  const go = (args, cwd, options = {}) => execFileSync(runtime.bin, args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20, ...options })
  const buildList = (mode) => JSON.parse(`[${go(['list', '-m', '-json', `-mod=${mode}`, 'all'], here).trim().replace(/}\s*{/g, '},{')}]`)

  const harnessRunner = readFileSync(helpers.fromRoot('harness/go/http-runner.go'), 'utf8')
  const runner = ownServer ? runnerWithOwnServer(harnessRunner) : harnessRunner
  const sources = () => readdirSync(here).filter((file) => file.endsWith('.go') || file === 'go.mod' || file === 'go.sum').sort()
  const stamp = () => sources().reduce((hash, file) => hash.update(`${file}\0`).update(readFileSync(path.join(here, file))).update('\0'), createHash('sha256').update(`${runtime.version}\0${runner}\0`)).digest('hex')

  let built = existsSync(record) && existsSync(binary) && existsSync(baseBinary) ? JSON.parse(readFileSync(record, 'utf8')) : null
  if (built?.stamp !== stamp()) {
    if (module) {
      if (!existsSync(path.join(here, 'go.sum'))) {
        // First time: find the build list from the modules' go.mod files
        // alone, check it, and only then download the sources and write go.sum.
        await checkAges(buildList('mod'))
        go(['mod', 'tidy'], here)
      }
      await checkAges(buildList('readonly'))
    }
    await rm(work, { recursive: true, force: true })
    await mkdir(work, { recursive: true })
    for (const file of sources()) await copyFile(path.join(here, file), path.join(work, file))
    await writeFile(path.join(work, 'runner.go'), runner)
    go(['build', '-mod=readonly', '-o', binary, '.'], work)
    // The same runner with no application: the baseline of the Go servers.
    await mkdir(baseDir, { recursive: true })
    await writeFile(path.join(baseDir, 'runner.go'), harnessRunner)
    await writeFile(path.join(baseDir, 'adapter.go'), BASE_ADAPTER)
    go(['build', '-o', baseBinary, 'runner.go', 'adapter.go'], baseDir)
    // The modules linked into the server, as the binary itself lists them.
    const linked = Object.fromEntries([...go(['version', '-m', binary], work).matchAll(/^\tdep\t(\S+)\t(\S+)/gm)].map(([, dep, version]) => [dep, version]))
    const { [module]: version = null, ...dependencies } = linked
    built = { stamp: stamp(), version, dependencies }
    await writeFile(record, JSON.stringify(built, null, 2) + '\n')
  }
  return {
    version: built.version,
    dependencies: built.dependencies,
    // What the modules add to the server binary; nothing is recorded for net/http itself.
    ...(module ? { install: { kind: 'binary', bytes: Math.max(0, statSync(binary).size - statSync(baseBinary).size) } } : {}),
    // Started in the application's folder, where its templates are.
    launch: { command: binary, args: [], cwd: here, phases: ['boot', 'ready'] },
    base: { command: baseBinary, args: ['-'], cwd: root },
  }
}
