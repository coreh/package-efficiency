// The short address for links printed on labels (site.json "shortUrl").
// https://pe.example/<code> goes to /r/<code> on the site, where the main
// Worker finds the result; anything else goes to the site's home page.
export default {
  fetch(request, env) {
    const code = /^\/([0-9a-z]{6,40})\/?$/.exec(new URL(request.url).pathname)
    return Response.redirect(code ? `${env.SITE_URL}/r/${code[1]}` : `${env.SITE_URL}/`, code ? 308 : 302)
  },
}
