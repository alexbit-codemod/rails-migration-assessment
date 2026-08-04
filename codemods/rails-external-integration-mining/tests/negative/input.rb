class User < ApplicationRecord
  def notify!
    Mailer.welcome(self).deliver_later
  end
end
