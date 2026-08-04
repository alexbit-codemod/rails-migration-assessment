class CreateUserService
  def self.call(attrs)
    User.create!(attrs)
  end
end
