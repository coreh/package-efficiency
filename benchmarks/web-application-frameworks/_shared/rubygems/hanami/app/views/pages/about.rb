# frozen_string_literal: true

module Shop
  module Views
    module Pages
      class About < Shop::View
        expose :title, layout: true do
          "About this shop"
        end
      end
    end
  end
end
