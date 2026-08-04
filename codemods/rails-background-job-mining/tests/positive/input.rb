class NotifyUserJob < ApplicationJob
  queue_as :mailers

  def perform(user_id)
    User.find(user_id).notify!
  end
end

class SyncAccountJob < ActiveJob::Base
  def perform(account_id)
    Account.find(account_id).sync!
  end
end
