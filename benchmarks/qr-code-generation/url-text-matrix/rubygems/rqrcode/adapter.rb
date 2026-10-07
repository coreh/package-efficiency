require 'rqrcode'

LEVELS = %i[l m q h].freeze

def operation(value)
  RQRCode::QRCode.new(value['text'], level: LEVELS[value['level']]).modules
end
