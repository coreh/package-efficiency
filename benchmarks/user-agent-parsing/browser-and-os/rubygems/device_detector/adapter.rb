require 'device_detector'

def operation(ua)
  d = DeviceDetector.new(ua)
  { 'browser' => d.name, 'version' => d.full_version, 'os' => d.os_name }
end
