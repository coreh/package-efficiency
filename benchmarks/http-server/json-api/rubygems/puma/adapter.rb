require 'puma'
def application
  lambda do |env|
    path = env['PATH_INFO']
    if path == '/'
      body, kind = 'Hello, World!', 'text/plain'
    elsif path.start_with?('/users/')
      id = path.split('/').last.to_i
      body, kind = JSON.generate({id: id, name: "User #{id}"}), 'application/json'
    else
      body, kind = JSON.generate({echo: JSON.parse(env['rack.input'].read)}), 'application/json'
    end
    [200, {'content-type'=>kind, 'content-length'=>body.bytesize.to_s}, [body]]
  end
end
