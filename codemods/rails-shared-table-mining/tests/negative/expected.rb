class User < ApplicationRecord
  def rename(name)
    update!(name: name)
  end
end
