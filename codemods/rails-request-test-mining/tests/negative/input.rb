require "rails_helper"

RSpec.describe User do
  it "validates email" do
    user = User.new(email: nil)
    expect(user).not_to be_valid
  end
end
