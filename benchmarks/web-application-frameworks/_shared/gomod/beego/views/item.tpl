{{template "header.tpl" .Name}}
<main id="bench" data-item="{{.ID}}">
  <h1>{{.Name}}</h1>
  <p class="price">{{.Price}}</p>
  {{if .InStock}}<p class="stock">In stock</p>{{else}}<p class="stock out">Sold out</p>{{end}}
  {{if .DiscountPercent}}<p class="discount">Save {{.DiscountPercent}}%</p>{{end}}
  <p class="note">{{.Note}}</p>
  <ul class="tags">{{range .Tags}}<li>{{.}}</li>{{end}}</ul>
  <table class="related">
    <thead><tr><th>Item</th><th>Price</th></tr></thead>
    <tbody>{{range .Related}}<tr><td><a href="/items/{{.ID}}">{{.Name}}</a></td><td>{{.Price}}</td></tr>{{end}}</tbody>
  </table>
  <footer hidden>rendered</footer>
</main>
{{template "footer.tpl"}}
