# Compress responses in the application's own process, for a client that
# accepts it. A generated application leaves this to Thruster, the proxy its
# Dockerfile starts in front of Puma, which is a second process.
Rails.application.config.middleware.insert_before ActionDispatch::Static, Rack::Deflater
