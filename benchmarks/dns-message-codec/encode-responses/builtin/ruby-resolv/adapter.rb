require 'resolv'

IN = Resolv::DNS::Resource::IN
TYPES = { 'A' => IN::A, 'AAAA' => IN::AAAA, 'CNAME' => IN::CNAME, 'MX' => IN::MX, 'TXT' => IN::TXT }.freeze
Name = Resolv::DNS::Name

def operation(input)
  m = Resolv::DNS::Message.new(input['id'])
  m.qr = 1
  m.aa = input['aa'] ? 1 : 0
  m.rd = input['rd'] ? 1 : 0
  m.ra = input['ra'] ? 1 : 0
  q = input['question']
  m.add_question(q['name'], TYPES[q['type']])
  input['answers'].each do |a|
    d = a['data']
    data = case a['type']
           when 'A' then IN::A.new(d)
           when 'AAAA' then IN::AAAA.new(d)
           when 'CNAME' then IN::CNAME.new(Name.create(d))
           when 'MX' then IN::MX.new(d['preference'], Name.create(d['exchange']))
           else IN::TXT.new(*d)
           end
    m.add_answer(a['name'], a['ttl'], data)
  end
  m.encode
end

def describe(bytes)
  bytes.bytes
end
