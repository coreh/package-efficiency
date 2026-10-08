import { generateSync, verifySync } from 'otplib'

export const operation = ({ secret, time, counter, code }) => [
  generateSync({ strategy: 'hotp', secret, counter }),
  generateSync({ secret, epoch: time }),
  verifySync({ secret, token: code, epoch: time, epochTolerance: 30 }).valid,
]
