import { getItem } from '../../../lib/items.js'

export function GET(request, { id }) {
  return Response.json(getItem(Number(id)))
}
