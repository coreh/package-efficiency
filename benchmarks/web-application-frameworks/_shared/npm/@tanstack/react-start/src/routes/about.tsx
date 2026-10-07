import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
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
