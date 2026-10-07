require 'text'
def operation(value)
  query, words = value
  best = 0
  best_distance = nil
  words.each_with_index do |w, i|
    d = Text::Levenshtein.distance(query, w)
    if best_distance.nil? || d < best_distance
      best_distance = d
      best = i
    end
  end
  best
end
