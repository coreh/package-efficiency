# Mounts the application, as the generated config/apps.rb does.
Padrino.configure_apps do
  set :session_secret, 'not-a-secret-the-shop-has-no-sessions'
end

Padrino.mount('Shop::App', app_file: File.expand_path('../app/app.rb', __dir__)).to('/')
