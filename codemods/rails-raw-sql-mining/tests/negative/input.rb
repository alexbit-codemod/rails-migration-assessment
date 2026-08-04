class User < ApplicationRecord
  def self.active
    where(active: true).order(:name)
  end
end
