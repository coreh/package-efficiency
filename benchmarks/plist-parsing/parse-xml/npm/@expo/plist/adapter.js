import expoPlist from '@expo/plist'
// A CommonJS module with `exports.default`: Node and Deno hand over the whole
// exports object, Bun the default export.
const plist = expoPlist.default ?? expoPlist
export const operation = (xml) => plist.parse(xml)
