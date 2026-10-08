import { compileExpression } from 'filtrex'
export const operation = ({ expr, vars }) => {
  const run = compileExpression(expr)
  return vars.map((scope) => run(scope))
}
