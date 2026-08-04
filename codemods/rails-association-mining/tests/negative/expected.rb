class User < ApplicationRecord
  def posts
    Post.where(user_id: id)
  end
end

def has_many_helper
  :noop
end
