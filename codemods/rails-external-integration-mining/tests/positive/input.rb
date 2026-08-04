class BillingClient
  def charge(payload)
    HTTParty.post("https://payments.example/charge", body: payload)
  end

  def faraday_get
    conn = Faraday.new(url: "https://api.example")
    conn.get("/v1/status")
  end

  def legacy
    RestClient.get("https://legacy.example/ping")
  end

  def stdlib
    Net::HTTP.get(URI("https://example.com"))
  end
end
