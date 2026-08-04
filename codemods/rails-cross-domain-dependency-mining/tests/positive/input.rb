module Boards
  class Card < ApplicationRecord
    def deliver_notification
      Notifications::Delivery.call(self)
      Search::Indexer.reindex(self)
    end
  end
end
