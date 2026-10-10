def operation(value)
  keep = value['keep']
  m = value['entries'].dup.freeze
  kept = keep.include?(0) ? [m] : []
  value['ops'].each_with_index do |(kind, k, v), i|
    m = (kind == 'set' ? m.merge(k => v) : m.except(k)).freeze
    kept << m if keep.include?(i + 1)
  end
  lookups = value['lookups']
  kept.map { |h| [h.size, lookups.map { |k| h[k] }] }
end
