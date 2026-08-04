module Boards
  class Card < ApplicationRecord
    def notify!
      Notifications::Delivery.call(self)
    end
  end
end
