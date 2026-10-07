import { createFileRoute } from '@tanstack/react-router'
import { item } from '../../../item'

export const Route = createFileRoute('/api/items/$id')({
  server: {
    handlers: {
      GET: ({ params }) => Response.json(item(Number(params.id))),
    },
  },
})
