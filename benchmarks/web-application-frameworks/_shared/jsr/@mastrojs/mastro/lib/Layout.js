import { html } from '@mastrojs/mastro'

export const Layout = ({ title, children }) => html`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
  </head>
  <body>
    ${children}
  </body>
</html>`
