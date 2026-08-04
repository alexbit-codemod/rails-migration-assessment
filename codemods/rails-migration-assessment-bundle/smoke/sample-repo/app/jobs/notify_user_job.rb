class NotifyUserJob < ApplicationJob
  queue_as :default
  def perform(user_id)
    User.find(user_id).notify!
  end
end
