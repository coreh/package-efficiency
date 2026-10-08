require 'ostruct'

def wrap(hash)
  OpenStruct.new(hash.transform_values { |v| v.is_a?(Hash) ? wrap(v) : v })
end

def unwrap(struct)
  struct.to_h.transform_values { |v| v.is_a?(OpenStruct) ? unwrap(v) : v }
end

def operation(input)
  root = wrap(input['doc'])
  reads = []
  input['ops'].each do |op, path, value|
    if op == 'r'
      reads << path.inject(root) { |o, k| o.public_send(k) }
    else
      parent = path[0...-1].inject(root) { |o, k| o.public_send(k) }
      parent.public_send("#{path.last}=", value)
    end
  end
  [reads, unwrap(root)]
end
