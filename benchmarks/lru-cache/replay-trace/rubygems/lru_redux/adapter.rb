require 'lru_redux'

def operation(input)
  cache = LruRedux::Cache.new(input["capacity"])
  hits = 0
  input["keys"].each do |key|
    if cache[key].nil?
      cache[key] = 1
    else
      hits += 1
    end
  end
  hits
end
