require "rails_helper"

RSpec.describe "Posts API", type: :request do
  it "lists posts" do
    get "/posts"
    expect(response).to have_http_status(:ok)
  end

  it "creates a post" do
    post "/posts", params: { post: { title: "Hi" } }
    expect(response).to have_http_status(:created)
  end
end
