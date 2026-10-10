require 'tzinfo'

# Untimed, once per fixture: the zone is looked up by name.
def prepare(value)
  [TZInfo::Timezone.get(value['zone']), value['instants']]
end

def operation(value)
  tz, instants = value
  instants.map do |t|
    lt = tz.to_local(Time.at(t))
    [lt.strftime('%Y-%m-%dT%H:%M:%S'), lt.utc_offset]
  end
end
