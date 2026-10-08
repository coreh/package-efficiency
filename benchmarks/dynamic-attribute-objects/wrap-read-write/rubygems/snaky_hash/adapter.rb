require 'snaky_hash'

def operation(input)
  root = SnakyHash::StringKeyed.new(input['doc'])
  reads = []
  input['ops'].each do |op, path, value|
    if op == 'r'
      reads << path.inject(root) { |o, k| o.public_send(k) }
    else
      parent = path[0...-1].inject(root) { |o, k| o.public_send(k) }
      parent.public_send("#{path.last}=", value)
    end
  end
  [reads, root.to_h]
end
