import TurndownService from 'turndown'
const service = new TurndownService()
export const operation = (html) => service.turndown(html)
