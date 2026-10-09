# The Padrino application, booted in production mode inside the benchmark
# runner's process. The runner serves the Rack app this returns with one
# Puma::Server (threads, no workers).
#
# Padrino.application is the Rack app that `padrino start` and config.ru
# (`run Padrino.application`) serve.
ENV['RACK_ENV'] = 'production'
Dir.chdir(__dir__)
require File.expand_path('config/boot', __dir__)

def application
  Padrino.application
end

require 'puma'
