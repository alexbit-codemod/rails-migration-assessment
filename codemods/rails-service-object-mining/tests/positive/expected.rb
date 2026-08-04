class CreateUserService
  def self.call(attrs)
    User.create!(attrs)
  end
end

class NotifyUserInteractor
  def call(user)
    user.notify!
  end
end

module Billing
  class ChargeCustomer < ApplicationService
    def perform(invoice)
      invoice.charge!
    end
  end
end
