class TransferService
  def call(from, to, amount)
    ActiveRecord::Base.transaction do
      from.with_lock do
        from.update!(balance: from.balance - amount)
        to.update!(balance: to.balance + amount)
      end
    end
  end
end

class Account < ApplicationRecord
  def freeze!
    lock!
  end
end
