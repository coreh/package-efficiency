import { getQuickJS } from 'quickjs-emscripten'

const QuickJS = await getQuickJS()

export const operation = (script) => QuickJS.evalCode(script)
