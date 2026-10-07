require_relative "boot"

require "rails"
# Only the frameworks this application uses, instead of "rails/all": no
# Active Record, Active Job, Active Storage, Action Mailer, Action Mailbox,
# Action Text or Action Cable.
require "action_controller/railtie"
require "action_view/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Shop
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    config.autoload_lib(ignore: %w[assets tasks])

    # The application keeps nothing about a visitor: no session, and so no
    # flash and no forgery token (it has no form and takes no POST).
    config.session_store :disabled
    config.action_controller.allow_forgery_protection = false

    # Nothing is cached through Rails.cache, so there is no store behind it.
    config.cache_store = :null_store

    # The middleware this application has no use for (see `bin/rails middleware`).
    # What stays: ActionDispatch::Static (public/ and the compiled assets),
    # ActionDispatch::Executor, the cache's per-request local store,
    # ActionDispatch::ShowExceptions, ActionDispatch::DebugExceptions and Rack::Head.
    [
      Rack::Sendfile,                               # no X-Sendfile front end
      Rack::Runtime,                                # the X-Runtime header
      Rack::MethodOverride,                         # _method in forms
      ActionDispatch::RequestId,                    # X-Request-Id, for log lines
      ActionDispatch::RemoteIp,                     # the client address behind proxies
      Rails::Rack::SilenceRequest,                  # quiet logs for /up
      Rails::Rack::Logger,                          # request logging
      ActionDispatch::Callbacks,
      ActionDispatch::Cookies,
      ActionDispatch::Flash,
      ActionDispatch::ContentSecurityPolicy::Middleware,
      Rack::ConditionalGet,                         # If-None-Match / If-Modified-Since
      Rack::ETag,                                   # a digest of every body
      Rack::TempfileReaper                          # uploads
    ].each { |middleware| config.middleware.delete middleware }
  end
end
