class User < ApplicationRecord
  def password_complexity
    errors.add(:password, "too weak") if password.to_s.length < 8
  end
end
