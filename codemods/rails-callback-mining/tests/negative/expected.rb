class User < ApplicationRecord
  def normalize_email
    self.email = email.downcase
  end
end
