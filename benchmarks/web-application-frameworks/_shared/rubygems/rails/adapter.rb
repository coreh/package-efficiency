# The Rails application, booted in production mode inside the benchmark
# runner's process. The runner serves the Rack app this returns with one
# Puma::Server (threads, no workers).
#
# config.ru is what `rails server` and Puma load too: it requires
# config/environment (Bundler, then the application) and gives the Rack app.
ENV["RAILS_ENV"] ||= "production"
require "rack"

def application
  @application ||= Rack::Builder.parse_file(File.expand_path("config.ru", __dir__))
end

# Booted when this file is loaded, so that the runner's `loaded` phase is the
# application's boot, and Puma is there for the runner to start.
application
require "puma"
