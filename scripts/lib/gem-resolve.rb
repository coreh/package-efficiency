# Resolve gems, and the gems they require at run time, to exact .gem files for
# this Ruby and platform. Run by scripts/lib/native-packages.mjs; reads a
# request as JSON on standard input and prints the answer as JSON.
#
# Request:
#   roots       names of the gems asked for
#   pins        name -> version: binding for a root, preferred for anything else
#   minAgeDays  a version counts only when it was published at least this many
#               days ago (every file of it this machine could use)
#   downloads   folder the .gem files are kept in
#
# Answer: {"gems": [{name, version, platform, sha256, published, compiles,
# requires}], "fromRuby": {name: version}, "rubyGems": "<folder>"}.
#
# A version is chosen from the RubyGems API alone (age, checksum, required Ruby
# version). Only then is its .gem downloaded and its checksum compared with the
# API's, and the specification inside it read for what it requires and for
# whether it has a native extension (`compiles`): reading a specification runs
# nothing. A precompiled gem for this platform is preferred to the source gem,
# since it installs without compiling. A requirement that a gem shipped with
# Ruby itself satisfies (a default or bundled gem) is left to Ruby (`fromRuby`).
# The newest eligible version that satisfies what has been required so far is
# taken, and the walk starts over when a later requirement rules a choice out.
require 'json'
require 'net/http'
require 'uri'
require 'digest'
require 'fileutils'
require 'rubygems/package'

request = JSON.parse(STDIN.read)
MIN_AGE_DAYS = request.fetch('minAgeDays')
CUTOFF = Time.now - MIN_AGE_DAYS * 86_400
PINS = request.fetch('pins', {})
ROOTS = request.fetch('roots')
DOWNLOADS = request.fetch('downloads')
RUBY = Gem::Version.new(RUBY_VERSION)
# The gems that came with Ruby: default gems, and the bundled gems in Ruby's own folder.
RUBY_GEMS = File.join(RbConfig::CONFIG['rubylibprefix'], 'gems', RbConfig::CONFIG['ruby_version'])
SHIPPED = Gem::Specification.select { |spec| spec.default_gem? || spec.base_dir == RUBY_GEMS }.group_by(&:name)

def get(url, limit = 5)
  raise "too many redirects: #{url}" if limit.zero?
  uri = URI(url)
  response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: 30, read_timeout: 120) { |http| http.get(uri.request_uri) }
  case response
  when Net::HTTPSuccess then response.body
  when Net::HTTPRedirection then get(URI.join(url, response['location']).to_s, limit - 1)
  else abort "RubyGems: #{url}: #{response.code}"
  end
end

VERSIONS = {}
def versions(name)
  VERSIONS[name] ||= JSON.parse(get("https://rubygems.org/api/v1/versions/#{name}.json"))
end

def usable?(entry)
  required = entry['ruby_version']
  required.nil? || Gem::Requirement.new(*required.split(',').map(&:strip)).satisfied_by?(RUBY)
rescue ArgumentError
  false
end

def local?(platform)
  platform != 'ruby' && Gem::Platform.local === Gem::Platform.new(platform)
end

# The version of `name` to install and the file of it for this machine.
def choose(name, requirements, root)
  pinned = PINS[name]
  by_number = versions(name).group_by { |entry| entry['number'] }
  numbers = by_number.keys.sort_by { |number| Gem::Version.new(number) }.reverse
  if pinned
    abort "#{name} is pinned at #{pinned}, which RubyGems does not list (yanked?)" if root && !by_number.key?(pinned)
    numbers = root ? [pinned] : [pinned, *numbers.reject { |number| number == pinned }].select { |number| by_number.key?(number) }
  end
  numbers.each do |number|
    version = Gem::Version.new(number)
    next if version.prerelease? || !requirements.all? { |requirement| requirement.satisfied_by?(version) }
    entries = by_number[number].select { |entry| entry['platform'] == 'ruby' || local?(entry['platform']) }
    old_enough = !entries.empty? && entries.all? { |entry| Time.parse(entry['created_at']) <= CUTOFF }
    file = entries.select { |entry| usable?(entry) }.min_by { |entry| entry['platform'] == 'ruby' ? 1 : 0 }
    if old_enough && file
      return file
    elsif root && pinned
      abort "#{name} #{number} is pinned but not eligible: less than #{MIN_AGE_DAYS} days old, or not for Ruby #{RUBY_VERSION} on this platform"
    end
  end
  abort "no eligible version of #{name} satisfies #{requirements.map(&:to_s).join(', ')} (at least #{MIN_AGE_DAYS} days old, for Ruby #{RUBY_VERSION} on this platform)"
end

# The .gem of an entry already chosen by age: fetched once, its checksum
# compared with the API's every time.
def download(name, entry)
  id = "#{name}-#{entry['number']}#{entry['platform'] == 'ruby' ? '' : "-#{entry['platform']}"}"
  file = File.join(DOWNLOADS, "#{id}.gem")
  unless File.exist?(file) && Digest::SHA256.file(file).hexdigest == entry['sha']
    bytes = get("https://rubygems.org/downloads/#{id}.gem")
    abort "Gem checksum failed: #{id}" unless Digest::SHA256.hexdigest(bytes) == entry['sha']
    FileUtils.mkdir_p(DOWNLOADS)
    partial = "#{file}.#{Process.pid}"
    File.binwrite(partial, bytes)
    File.rename(partial, file)
  end
  file
end

require 'time'
constraints = Hash.new { |hash, name| hash[name] = [] }
chosen = nil
from_ruby = nil
25.times do
  chosen = {}
  from_ruby = {}
  pending = ROOTS.dup
  consistent = true
  until pending.empty?
    name = pending.shift
    next if chosen.key?(name) || from_ruby.key?(name)
    unless ROOTS.include?(name)
      shipped = (SHIPPED[name] || []).select { |spec| constraints[name].all? { |requirement| requirement.satisfied_by?(spec.version) } }.max_by(&:version)
      if shipped
        from_ruby[name] = shipped.version.to_s
        # What a bundled gem itself requires is Ruby's too, or is resolved here.
        shipped.runtime_dependencies.each { |dependency| constraints[dependency.name] |= [dependency.requirement]; pending << dependency.name }
        next
      end
    end
    entry = choose(name, constraints[name], ROOTS.include?(name))
    spec = Gem::Package.new(download(name, entry)).spec
    chosen[name] = { entry: entry, spec: spec }
    spec.runtime_dependencies.each do |dependency|
      added = !constraints[dependency.name].include?(dependency.requirement)
      constraints[dependency.name] |= [dependency.requirement]
      settled = chosen[dependency.name]&.dig(:spec)&.version || (from_ruby[dependency.name] && Gem::Version.new(from_ruby[dependency.name]))
      consistent = false if added && settled && !dependency.requirement.satisfied_by?(settled)
      pending << dependency.name
    end
  end
  break if consistent
  chosen = nil
end
abort 'the requirements of these gems did not settle on one set of versions' unless chosen

gems = chosen.keys.sort.map do |name|
  entry, spec = chosen[name].values_at(:entry, :spec)
  {
    name: name,
    version: entry['number'],
    platform: entry['platform'] == 'ruby' ? nil : entry['platform'],
    sha256: entry['sha'],
    published: entry['created_at'][0, 10],
    # Has a native extension: `gem install` compiles it on this machine.
    compiles: !spec.extensions.empty?,
    requires: spec.runtime_dependencies.map(&:name).sort,
  }
end
puts JSON.generate(gems: gems, fromRuby: from_ruby.sort.to_h, rubyGems: RUBY_GEMS)
