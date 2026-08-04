class User < ApplicationRecord
  has_many :posts
  belongs_to :account, polymorphic: true
  validates :email, presence: true
  before_save :normalize_email

  def self.active
    where("active = 1")
  end
end
