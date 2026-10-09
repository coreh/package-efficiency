import { json } from '@sveltejs/kit'
import { getItem } from '../../../../lib/items.js'

export function GET({ params }) {
  return json(getItem(Number(params.id)))
}
