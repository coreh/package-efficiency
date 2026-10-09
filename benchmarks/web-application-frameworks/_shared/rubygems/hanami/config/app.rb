# frozen_string_literal: true

require "hanami"

module Shop
  class App < Hanami::App
    # The benchmark's requests have no Accept header, where a browser's ask for
    # text/html; without this Hanami answers them as application/octet-stream.
    config.actions.formats.default = :html
  end
end
