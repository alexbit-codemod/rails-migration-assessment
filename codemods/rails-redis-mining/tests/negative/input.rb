class User < ApplicationRecord
  def get
    attributes
  end
end

hash = { a: 1 }
hash.get(:a) if hash.respond_to?(:get)
