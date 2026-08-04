class User < ApplicationRecord
  has_many :posts, dependent: :destroy
  belongs_to :account, polymorphic: true
  has_one :profile
  has_and_belongs_to_many :tags
end
