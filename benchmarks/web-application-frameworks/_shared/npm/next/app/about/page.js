// A static page: no request data, so `next build` prerenders it to HTML.
export const metadata = { title: 'About this shop' }

export default function AboutPage() {
  return (
    <main id="bench">
      <h1>About this shop</h1>
      <p>This page is the same for every visitor.</p>
      <ul className="facts">
        <li>One static page</li>
        <li>One dynamic page</li>
        <li>One API route</li>
      </ul>
    </main>
  )
}
