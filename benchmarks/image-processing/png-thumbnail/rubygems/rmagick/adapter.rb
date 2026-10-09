require 'rmagick'

def prepare(value)
  [[value['png']].pack('H*'), value['width'], value['height']]
end

def operation(value)
  blob, width, height = value
  image = Magick::Image.from_blob(blob).first
  thumbnail = image.resize(width, height, Magick::LanczosFilter)
  thumbnail.to_blob { |info| info.format = 'PNG' }
end

def describe(result)
  [result].pack('m0')
end
