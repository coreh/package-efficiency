def operation(value)
  list = value['items'].dup.freeze
  gets = []
  value['ops'].each do |kind, i, v|
    case kind
    when 'set' then list = (list[0...i] + [v] + list[(i + 1)..]).freeze
    when 'insert' then list = (list[0...i] + [v] + list[i..]).freeze
    when 'remove' then list = (list[0...i] + list[(i + 1)..]).freeze
    else gets << list[i]
    end
  end
  [list, gets]
end
