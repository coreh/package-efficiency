require 'clamp'
Clamp.allow_options_after_parameters = true

class Cli < Clamp::Command
  option ['-v', '--verbose'], :flag, 'verbose'
  option ['-d', '--dry-run'], :flag, 'dry run'
  option ['-n', '--name'], 'TEXT', 'name'
  option ['-c', '--count'], 'INT', 'count' do |s| Integer(s) end
  option ['-t', '--tag'], 'TEXT', 'tag', multivalued: true
  parameter '[FILE] ...', 'files'
  def execute; end
end

def operation(value)
  c = Cli.new('x')
  c.parse(value['argv'])
  { 'verbose' => !!c.verbose?, 'dry' => !!c.dry_run?, 'name' => c.name, 'count' => c.count, 'tags' => c.tag_list, 'files' => c.file_list }
end
