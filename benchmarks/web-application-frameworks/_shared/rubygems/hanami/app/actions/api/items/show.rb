# frozen_string_literal: true

require "json"

module Shop
  module Actions
    module API
      module Items
        class Show < Shop::Action
          def handle(request, response)
            response.format = :json
            response.body = JSON.generate(Shop::Item.find(request.params[:id]).as_json)
          end
        end
      end
    end
  end
end
