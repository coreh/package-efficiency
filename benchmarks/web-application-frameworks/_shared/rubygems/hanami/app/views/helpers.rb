# auto_register: false
# frozen_string_literal: true

module Shop
  module Views
    module Helpers
      # A price as the pages show it: 236 cents is $2.36.
      def price(cents)
        format("$%.2f", cents / 100.0)
      end
    end
  end
end
