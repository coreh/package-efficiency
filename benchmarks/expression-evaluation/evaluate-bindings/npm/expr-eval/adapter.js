import { Parser } from 'expr-eval'
export const operation = ({ expr, vars }) => {
  const parsed = Parser.parse(expr)
  return vars.map((scope) => parsed.evaluate(scope))
}
