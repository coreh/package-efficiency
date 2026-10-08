import { Secret, HOTP, TOTP } from '@hectorm/otpauth'

export const operation = ({ secret, time, counter, code }) => {
  const key = Secret.fromBase32(secret)
  const timestamp = time * 1000
  const totp = new TOTP({ secret: key })
  return [
    new HOTP({ secret: key }).generate({ counter }),
    totp.generate({ timestamp }),
    totp.validate({ token: code, timestamp, window: 1 }) !== null,
  ]
}
