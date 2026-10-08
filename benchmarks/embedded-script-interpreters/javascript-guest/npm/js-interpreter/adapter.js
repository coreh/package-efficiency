import Interpreter from 'js-interpreter'

export const operation = (script) => {
  const interpreter = new Interpreter(script)
  interpreter.run()
  return interpreter.value
}
