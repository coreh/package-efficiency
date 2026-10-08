require 'stringio'
require 'action_dispatch'

RESOURCES = %w[users orders products invoices carts sessions teams projects tickets comments posts tags files folders devices alerts reports payments coupons reviews regions warehouses shipments accounts webhooks]
# Every endpoint answers with this, so no response is built for a match.
DONE = [200, {}.freeze, [].freeze].freeze
PARAMS = 'action_dispatch.request.path_parameters'

def endpoint(route)
  ->(env) { $routed = { 'route' => route, 'params' => env[PARAMS] }; DONE }
end

# The route set of a Rails application, without the application: each route
# ends in a Rack endpoint instead of a controller action.
ROUTES = ActionDispatch::Routing::RouteSet.new
ROUTES.draw do
  RESOURCES.each do |r|
    get "/api/#{r}", to: endpoint("GET /api/#{r}")
    post "/api/#{r}", to: endpoint("POST /api/#{r}")
    get "/api/#{r}/:id", to: endpoint("GET /api/#{r}/:id")
    put "/api/#{r}/:id", to: endpoint("PUT /api/#{r}/:id")
  end
end

$routed = nil

def prepare(value)
  { 'REQUEST_METHOD' => value['method'], 'PATH_INFO' => value['path'], 'SCRIPT_NAME' => '',
    'QUERY_STRING' => '', 'SERVER_NAME' => 'localhost', 'SERVER_PORT' => '80', 'HTTP_HOST' => 'localhost',
    'rack.input' => StringIO.new, 'rack.errors' => StringIO.new, 'rack.url_scheme' => 'http' }
end

def operation(env)
  $routed = nil
  ROUTES.call(env.dup)
  $routed
end
