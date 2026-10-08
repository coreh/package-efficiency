require 'device_detector'

DeviceDetector.config.max_cache_keys = 3

def operation(ua)
  d = DeviceDetector.new(ua)
  { 'browser' => d.name, 'version' => d.full_version, 'os' => d.os_name }
end
