import protobuf from 'protobufjs'

const field = (id, type, rule) => ({ id, type, rule })
const root = protobuf.Root.fromJSON({
  nested: {
    Location: { fields: { lat: field(1, 'double'), lon: field(2, 'double'), city: field(3, 'string') } },
    Event: { fields: { at: field(1, 'int32'), kind: field(2, 'string'), value: field(3, 'double') } },
    Telemetry: {
      fields: {
        id: field(1, 'int32'),
        name: field(2, 'string'),
        active: field(3, 'bool'),
        score: field(4, 'double'),
        tags: field(5, 'string', 'repeated'),
        samples: field(6, 'int32', 'repeated'),
        readings: field(7, 'double', 'repeated'),
        location: field(8, 'Location'),
        events: field(9, 'Event', 'repeated'),
      },
    },
  },
})
const Telemetry = root.lookupType('Telemetry')
export const operation = value => Telemetry.decode(Telemetry.encode(value).finish())
