require "stringio"
require 'sinatra/base'

RESOURCES = %w[users orders products invoices carts sessions teams projects tickets comments posts tags files folders devices alerts reports payments coupons reviews regions warehouses shipments accounts webhooks]

class RoutingApp < Sinatra::Base
  RESOURCES.each do |r|
    get("/api/#{r}") { $routed = { 'route' => "GET /api/#{r}", 'params' => {} }; '' }
    post("/api/#{r}") { $routed = { 'route' => "POST /api/#{r}", 'params' => {} }; '' }
    get("/api/#{r}/:id") { $routed = { 'route' => "GET /api/#{r}/:id", 'params' => { 'id' => params['id'] } }; '' }
    put("/api/#{r}/:id") { $routed = { 'route' => "PUT /api/#{r}/:id", 'params' => { 'id' => params['id'] } }; '' }
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
  RoutingApp.call(env.dup)
  $routed
end
