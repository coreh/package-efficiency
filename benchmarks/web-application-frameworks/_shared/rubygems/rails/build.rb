# The production build of the application in the current folder, as the
# Dockerfile of a generated application does it: `rails assets:precompile`
# (Propshaft writes public/assets and its manifest), then Bootsnap's cache of
# compiled code for the gems and for app/ and lib/.
# Started by prepare.mjs as: ruby build.rb <gem folder>
Gem.use_paths(ARGV[0], [ARGV[0], *Gem.default_path])
ENV["RAILS_ENV"] = "production"

require File.expand_path("config/application")
Rails.application.load_tasks
Rake::Task["assets:precompile"].invoke

require "bootsnap/cli"
status = Bootsnap::CLI.new(%w[precompile --gemfile app/ lib/]).run
exit(status) if status.is_a?(Integer) && status != 0
