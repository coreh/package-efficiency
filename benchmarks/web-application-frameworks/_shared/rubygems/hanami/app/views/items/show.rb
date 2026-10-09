# frozen_string_literal: true

module Shop
  module Views
    module Items
      class Show < Shop::View
        expose :item do |id:|
          Shop::Item.find(id)
        end

        expose :title, layout: true do |item|
          item.name
        end
      end
    end
  end
end
