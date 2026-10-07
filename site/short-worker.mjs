// The addresses the site had first (wrangler.short.jsonc), kept so that old
// links go on working. On the short one, https://pe.example/<code> goes to
// /<code> on the site, where the main Worker finds the result, and anything
// else goes to the home page. Any other host is the site's first address:
// the same path on the site.
export default {
  fetch(request, env) {
    const url = new URL(request.url)
    if (!url.hostname.startsWith('pe.')) return Response.redirect(`${env.SITE_URL}${url.pathname}${url.search}`, 308)
    const code = /^\/([0-9a-z]{6,40})\/?$/.exec(url.pathname)
    return Response.redirect(code ? `${env.SITE_URL}/${code[1]}` : `${env.SITE_URL}/`, code ? 308 : 302)
  },
}
