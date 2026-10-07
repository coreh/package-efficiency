// The API route: a Route Handler, run for every request.
import { getItem } from '../../../../lib/items.js'

export async function GET(request, { params }) {
  const { id } = await params
  return Response.json(getItem(Number(id)))
}
