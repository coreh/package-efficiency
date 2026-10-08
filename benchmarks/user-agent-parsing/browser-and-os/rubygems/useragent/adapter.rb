require 'user_agent'

def operation(ua)
  r = UserAgent.parse(ua)
  { 'browser' => r.browser, 'version' => r.version.to_s, 'os' => r.os }
end
