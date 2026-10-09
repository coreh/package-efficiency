require 'mixlib/cli'

class Cli
  include Mixlib::CLI
  option :verbose, short: '-v', long: '--verbose', boolean: true, default: false
  option :dry, short: '-d', long: '--dry-run', boolean: true, default: false
  option :force, short: '-f', long: '--force', boolean: true, default: false
  option :name, short: '-n', long: '--name NAME'
  option :count, short: '-c', long: '--count COUNT', proc: proc { |v| Integer(v) }
  option :tag, short: '-t', long: '--tag TAG', proc: proc { |v, memo| (memo || []) << v }
end

def operation(value)
  cli = Cli.new
  files = cli.parse_options(value['argv'].dup)
  c = cli.config
  { 'verbose' => c[:verbose], 'dry' => c[:dry], 'force' => c[:force], 'name' => c[:name], 'count' => c[:count], 'tags' => c[:tag] || [], 'files' => files }
end
