import { Eta } from '@eta-dev/eta'
const eta = new Eta()
eta.loadTemplate('@row', `<tr class="row<% if (it.rush) { %> rush<% } %>"><td><%= it.sku %></td><td><%= it.name %></td><td><%= it.qty %></td><td><%= it.price %></td><td><% if (it.rush) { %>Rush: <%= it.reason %><% } else { %>Standard<% } %></td></tr>`)
eta.loadTemplate('@page', `<article><h1><%= it.title %></h1><address><%= it.customer.name %> &lt;<%= it.customer.email %>&gt;, <%= it.customer.address.city %></address><table>
<% for (const row of it.rows) { %><%~ include('@row', row) %>
<% } %></table><footer><%= it.footer %> - <%= it.total %></footer></article>`)
export const operation = data => eta.render('@page', data)
