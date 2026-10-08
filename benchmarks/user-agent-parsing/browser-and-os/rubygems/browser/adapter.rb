require 'browser'

def operation(ua)
  b = Browser.new(ua)
  { 'browser' => b.name, 'version' => b.version, 'os' => b.platform.name }
end
