# Bootstrap of the Padrino application, as the generated config/boot.rb does:
# environment, the framework, logging, then the application's code.
RACK_ENV = ENV['RACK_ENV'] ||= 'production' unless defined?(RACK_ENV)
PADRINO_ROOT = File.expand_path('..', __dir__) unless defined?(PADRINO_ROOT)

require 'rubygems'
require 'padrino'

Padrino.before_load do
  # No request logging: the log goes nowhere (the stream :null of Padrino's logger).
  Padrino::Logger::Config[:production] = { log_level: :error, stream: :null }
  Padrino::Logger::Config[:staging] = Padrino::Logger::Config[:production]
end

Padrino.load!
