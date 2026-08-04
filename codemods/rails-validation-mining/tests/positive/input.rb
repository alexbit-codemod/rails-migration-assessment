class User < ApplicationRecord
  validates :email, presence: true, uniqueness: true
  validates_length_of :name, maximum: 80
  validate :password_complexity
end
