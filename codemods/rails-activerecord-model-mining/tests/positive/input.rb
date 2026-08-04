class User < ApplicationRecord
  def full_name
    "#{first_name} #{last_name}"
  end
end

class LegacyPost < ActiveRecord::Base
end

module Billing
  class Invoice < ApplicationRecord
  end
end
