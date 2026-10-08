require 'stringio'
require 'roda'

RESOURCES = %w[users orders products invoices carts sessions teams projects tickets comments posts tags files folders devices alerts reports payments coupons reviews regions warehouses shipments accounts webhooks]
# The labels are made once; the routing tree below is what runs per request.
LABELS = RESOURCES.to_h { |r| [r, ["GET /api/#{r}", "POST /api/#{r}", "GET /api/#{r}/:id", "PUT /api/#{r}/:id"].freeze] }.freeze
# Every handler halts with this, so Roda builds no response for a match.
DONE = [200, {}.freeze, [].freeze].freeze

class RoutingApp < Roda
  # Roda's core has r.get and r.post only; r.put comes from this plugin of the gem.
  plugin :all_verbs

  route do |r|
    r.on 'api' do
      LABELS.each do |name, (list, create, show, update)|
        r.on name do
          r.is do
            r.get { $routed = { 'route' => list, 'params' => {} }; r.halt(DONE) }
            r.post { $routed = { 'route' => create, 'params' => {} }; r.halt(DONE) }
          end
          r.is String do |id|
            r.get { $routed = { 'route' => show, 'params' => { 'id' => id } }; r.halt(DONE) }
            r.put { $routed = { 'route' => update, 'params' => { 'id' => id } }; r.halt(DONE) }
          end
        end
      end
      nil
    end
  end
end

APP = RoutingApp.freeze.app
$routed = nil

def prepare(value)
  { 'REQUEST_METHOD' => value['method'], 'PATH_INFO' => value['path'], 'SCRIPT_NAME' => '',
    'QUERY_STRING' => '', 'SERVER_NAME' => 'localhost', 'SERVER_PORT' => '80', 'HTTP_HOST' => 'localhost',
    'rack.input' => StringIO.new, 'rack.errors' => StringIO.new, 'rack.url_scheme' => 'http' }
end

def operation(env)
  $routed = nil
  APP.call(env.dup)
  $routed
end
