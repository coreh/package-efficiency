// Pages that are not written as files of their own: the thousands of packages
// that are listed but not measured yet. The build packs them into a few
// hundred JSON files (dist/lazy/pages/<n>.json), and the Worker in
// site/worker.mjs puts a page together when it is asked for. Both sides use
// this file to agree on which pack a page is in.
export const SHARDS = 512

// FNV-1a over the address's UTF-8 bytes.
export function shardOf(address) {
  let hash = 0x811c9dc5
  for (const byte of new TextEncoder().encode(address)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0
  return hash % SHARDS
}

// The embeddable shapes of labels (/embed/...svg) are packed the same way,
// into dist/lazy/embed/<n>.json: there are several for every result.
export const EMBED_SHARDS = 512
export const embedShardOf = (address) => shardOf(address) % EMBED_SHARDS
