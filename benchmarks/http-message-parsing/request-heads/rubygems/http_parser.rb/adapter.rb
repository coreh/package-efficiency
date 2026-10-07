require 'http/parser'

def operation(input)
  parser = Http::Parser.new
  headers = nil
  parser.on_headers_complete = proc { |h| headers = h; :stop }
  parser << input
  { 'method' => parser.http_method, 'path' => parser.request_url, 'minor' => parser.http_minor, 'headers' => headers.transform_values { |v| v.is_a?(Array) ? v : [v] } }
end
