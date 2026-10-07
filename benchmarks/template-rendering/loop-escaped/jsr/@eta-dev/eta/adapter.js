import { Eta } from '@eta-dev/eta'
const eta = new Eta()
const template = `<section title="<%= it.title %>"><h1><%= it.title %></h1><p>By <%= it.author %></p><ul>
<% for (const item of it.items) { %><li id="item-<%= item.id %>" class="item<% if (item.featured) { %> featured<% } %>" title="<%= item.name %>"><b><%= item.name %></b> <span><%= item.price %></span><% if (item.note) { %><em><%= item.note %></em><% } %><% for (const tag of item.tags) { %><i><%= tag %></i><% } %></li>
<% } %></ul><p><%= it.count %> items</p></section>`
export const operation = data => eta.renderString(template, data)
