import { getParams, jsonResponse } from '@mastrojs/mastro'
import { item } from '../../../lib/items.js'

export const GET = (req) => jsonResponse(item(Number(getParams(req).id)))
