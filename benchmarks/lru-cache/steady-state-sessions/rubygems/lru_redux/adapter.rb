require 'lru_redux'

def operation(input)
  cache = LruRedux::Cache.new(input["capacity"])
  hits = total = removed = 0
  input["keys"].each_with_index do |key, i|
    if i % 11 == 10
      removed += 1 unless cache.delete(key).nil?
    else
      value = cache[key]
      if value.nil?
        cache[key] = i
      else
        hits += 1
        total += value
      end
    end
  end
  [hits, total, removed, cache.count]
end
