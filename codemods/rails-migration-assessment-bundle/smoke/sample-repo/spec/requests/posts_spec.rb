require "rails_helper"

RSpec.describe "Posts", type: :request do
  it "lists" do
    get "/posts"
    expect(response).to have_http_status(:ok)
  end
end
