class PostsController < ApplicationController
  def index
    @posts = Post.all
  end

  def create
    Post.create!(params.permit(:title))
  end
end
