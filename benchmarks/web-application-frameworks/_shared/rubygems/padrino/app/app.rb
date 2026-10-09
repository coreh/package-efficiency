module Shop
  class App < Padrino::Application
    register Padrino::Rendering
    register Padrino::Helpers

    get '/about' do
      @title = 'About this shop'
      render 'pages/about'
    end

    get '/items/:id' do
      @item = Item.find(params[:id])
      @title = @item.name
      render 'items/show'
    end

    get '/api/items/:id' do
      content_type :json
      Item.find(params[:id]).as_json.to_json
    end
  end
end
