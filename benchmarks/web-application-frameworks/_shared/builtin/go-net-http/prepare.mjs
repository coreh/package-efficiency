// Builds the shop on Go's standard library (no module to install) and says how to start it.
// The age check of the modules, the build and the launch are shared by the
// Go applications: see ../../_go/go-app.mjs.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareGoApp } from '../../_go/go-app.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

export const prepare = (context) => prepareGoApp({ ...context, here })
