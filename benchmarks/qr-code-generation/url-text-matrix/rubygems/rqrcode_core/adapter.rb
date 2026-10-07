require 'rqrcode_core'

LEVELS = %i[l m q h].freeze

def operation(value)
  RQRCodeCore::QRCode.new(value['text'], level: LEVELS[value['level']]).modules
end
