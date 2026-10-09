# frozen_string_literal: true

module Shop
  class Routes < Hanami::Routes
    get "/about", to: "pages.about"
    get "/items/:id", to: "items.show"
    get "/api/items/:id", to: "api.items.show"
  end
end
