class PostsController < ApplicationController
  def index
  end
end

class CreateUser
  def self.call(attrs)
    User.create!(attrs)
  end
end

module Helpers
  class Formatter
  end
end
