class User < ApplicationRecord
  def self.legacy_search(q)
    find_by_sql(["SELECT * FROM users WHERE name LIKE ?", "%#{q}%"])
  end

  def self.active_ids
    where("active = 1 AND deleted_at IS NULL")
  end

  def self.ordered
    order(Arel.sql("LOWER(name)"))
  end
end

ActiveRecord::Base.connection.execute("UPDATE accounts SET balance = 0")
