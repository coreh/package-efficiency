import speakeasy from 'speakeasy'

export const operation = ({ secret, time, counter, code }) => [
  speakeasy.hotp({ secret, encoding: 'base32', counter }),
  speakeasy.totp({ secret, encoding: 'base32', time }),
  speakeasy.totp.verify({ secret, encoding: 'base32', token: code, time, window: 1 }),
]
