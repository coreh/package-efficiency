export default defineEventHandler((event) => getItem(Number(getRouterParam(event, 'id'))))
