require 'puma'
require 'roda'
class App < Roda
  plugin :json
  route do |r|
    r.root do
      response['content-type'] = 'text/plain'
      'Hello, World!'
    end
    r.get 'users', String do |id|
      {id: id.to_i, name: "User #{id}"}
    end
    r.post 'echo' do
      {echo: JSON.parse(request.body.read)}
    end
  end
end
def application
  App.app
end
