class Api::ItemsController < ApplicationController
  def show
    render json: Item.find(params[:id])
  end
end
