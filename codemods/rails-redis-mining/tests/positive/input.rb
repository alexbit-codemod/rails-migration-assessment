class CacheService
  def fetch_user(id)
    $redis.get("user:#{id}")
  end

  def store_user(id, payload)
    Redis.current.set("user:#{id}", payload)
  end

  def bump
    REDIS.incr("visits")
  end

  def via_sidekiq
    Sidekiq.redis { |r| r.get("lock") }
  end
end
