class User < ApplicationRecord
  before_save :normalize_email
  after_create :send_welcome
  after_commit :sync_external, on: :create
  before_destroy { soft_delete! }
end
