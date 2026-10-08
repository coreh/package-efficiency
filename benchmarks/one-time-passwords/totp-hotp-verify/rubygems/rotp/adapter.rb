require 'rotp'

def operation(value)
  secret = value['secret']
  totp = ROTP::TOTP.new(secret)
  [
    ROTP::HOTP.new(secret).at(value['counter']),
    totp.at(value['time']),
    !totp.verify(value['code'], at: value['time'], drift_behind: 30, drift_ahead: 30).nil?
  ]
end
