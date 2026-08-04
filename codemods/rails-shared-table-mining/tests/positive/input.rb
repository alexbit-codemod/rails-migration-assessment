class LegacyUser < ApplicationRecord
  self.table_name = "legacy_users"
end

class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.references :account
      t.timestamps
    end
  end
end
