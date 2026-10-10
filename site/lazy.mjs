// Pages that are not written as files of their own: the thousands of packages
// that are listed but not measured yet. The build packs them into a few
// hundred JSON files (dist/lazy/pages/<n>.json), and the Worker in
// site/worker.mjs puts a page together when it is asked for. Both sides use
// this file to agree on which pack a page is in.
export const SHARDS = 512

// FNV-1a over the address's UTF-8 bytes.
function hash(text) {
  let hash = 0x811c9dc5
  for (const byte of new TextEncoder().encode(text)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0
  return hash
}

// What changes together is packed together, so that a new result rewrites
// (and a deploy uploads) a few packs, not a pack in every corner of the site:
//   /results/<category>/<task>/…        the result pages of one task
//   /source/<category>/<task>/…         the adapter sources of one task
//   /embed/<category>/<task>/…, /labels/<category>/<task>/…
//                                       the labels of one task
//   /results/runtimes/<runtime>/<scope>/, /embed/runtimes/<runtime>/<scope>/…
//                                       every runtime's summary of one scope
// Any other page (a listed package) goes by its own address.
export function packOf(address) {
  const parts = address.split('/')
  if ((parts[1] === 'results' || parts[1] === 'embed') && parts[2] === 'runtimes') {
    // The scope is everything between the runtime and the end: a page's
    // address ends in a slash, a label's in <basis>/<file>.
    const scope = parts.slice(4, parts[1] === 'results' ? -1 : -2).join('/')
    return `${parts[1]}-summary:${scope}`
  }
  if (parts[1] === 'results' || parts[1] === 'source') return parts.slice(0, 4).join('/')
  if (parts[1] === 'embed' || parts[1] === 'labels') return `labels:${parts.slice(2, 4).join('/')}`
  return address
}

export const shardOf = (address) => hash(packOf(address)) % SHARDS

// The embeddable shapes of labels (/embed/...svg) are packed the same way,
// into dist/lazy/embed/<n>.json: there are several for every result.
export const EMBED_SHARDS = 512
export const embedShardOf = (address) => shardOf(address) % EMBED_SHARDS
