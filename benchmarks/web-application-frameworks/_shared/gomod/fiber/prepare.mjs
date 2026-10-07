// Builds the shop on Fiber at the version go.mod pins, and says how to start it. Fiber serves the listener itself (fasthttp), not through net/http.
// The age check of the modules, the build and the launch are shared by the
// Go applications: see ../../_go/go-app.mjs.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareGoApp } from '../../_go/go-app.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

export const prepare = (context) => prepareGoApp({ ...context, here, module: 'github.com/gofiber/fiber/v3', ownServer: true })
