class User < ApplicationRecord
  def as_json
    { id: id }
  end
end
