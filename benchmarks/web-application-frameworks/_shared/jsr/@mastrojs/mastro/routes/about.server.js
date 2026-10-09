import { html, htmlToResponse } from '@mastrojs/mastro'
import { Layout } from '../lib/Layout.js'

export const GET = () =>
  htmlToResponse(
    Layout({
      title: 'About this shop',
      children: html`<main id="bench">
  <h1>About this shop</h1>
  <p>This page is the same for every visitor.</p>
  <ul class="facts"><li>One static page</li><li>One dynamic page</li><li>One API route</li></ul>
</main>`,
    }),
  )
