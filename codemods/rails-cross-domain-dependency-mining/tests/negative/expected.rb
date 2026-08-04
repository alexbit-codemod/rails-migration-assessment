module Boards
  class Card < ApplicationRecord
    def title_up
      Boards::TitleFormatter.call(title)
    end
  end
end
