class UserSerializer < ActiveModel::Serializer
  attributes :id, :email
end

class PostResource
  include Alba::Resource
  attributes :id, :title
end

class AccountBlueprint < Blueprinter::Base
  identifier :id
  fields :name
end
