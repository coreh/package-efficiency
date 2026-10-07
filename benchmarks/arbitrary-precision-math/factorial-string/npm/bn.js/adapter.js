import BN from 'bn.js'
export const operation = (n) => {
  let r = new BN(1)
  // imuln multiplies in place by a small number, with no BN built per step.
  for (let i = 2; i <= n; i++) r.imuln(i)
  return r.toString(10)
}
