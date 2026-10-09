import { getItem } from '../../../lib/items.js'

export const prerender = false

export function GET({ params }) {
  return Response.json(getItem(Number(params.id)))
}
