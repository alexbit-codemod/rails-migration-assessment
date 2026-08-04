class Vehicle < ApplicationRecord
  self.inheritance_column = :type
end

class Car < Vehicle
end
