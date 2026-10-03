# SuccessFlow

Static website for the SuccessFlow marketing pages (https://www.successflow.it.com).

## Structure

- `index.html` - landing page
- `services/` - service detail pages
- `portfolio/` - portfolio detail pages
- `assets/css/main.css` - shared styles
- `assets/js/main.js` - shared JavaScript
- `assets/js/i18n.js` - TH/EN translations
- `assets/images/` - images and logo

## Run locally

Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy (Cloudflare Pages)

The site is plain static files with no build step.

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → select this repo.
2. Production branch: `main`, Framework preset: `None`, Build command: empty, Build output directory: `/`.
3. Add the custom domain `www.successflow.it.com` (canonical URLs, `sitemap.xml` and `robots.txt` all use `www`).
4. Redirect the apex `successflow.it.com` to `https://www.successflow.it.com` with a 301 Redirect Rule.

The contact form posts to an n8n webhook (see `assets/js/main.js`); its CORS settings must allow the site's origin.

File names are case-sensitive on the server, so image paths must match the file name exactly.
