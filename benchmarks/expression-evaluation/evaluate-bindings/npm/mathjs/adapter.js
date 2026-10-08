import { compile } from 'mathjs'
export const operation = ({ expr, vars }) => {
  const code = compile(expr)
  return vars.map((scope) => code.evaluate(scope))
}
