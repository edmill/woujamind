# Embedding on craftedby.ai

This app is configured to run inside an iframe on **craftedby.ai** so your users can use it without leaving your platform.

## What’s configured

1. **Frame ancestors (Vercel)**  
   `vercel.json` sets a `Content-Security-Policy: frame-ancestors` header so the app can be embedded only by:
   - Its own origin (`'self'`) when opened directly
   - `https://craftedby.ai` and `https://*.craftedby.ai` (e.g. `https://app.craftedby.ai`)

   If you deploy somewhere other than Vercel, set the same CSP header so your app’s URL is allowed as a frame ancestor.

2. **Error “Report Bug” link**  
   The error boundary uses an `<a target="_blank" rel="noopener noreferrer">` link instead of `window.open`, so the report link works reliably when the app runs in an iframe and isn’t blocked as a popup.

3. **Logo (iframe-safe)**  
   The header logo is inlined as base64 in the JS bundle. A prebuild script (`scripts/inline-logo.js`) generates `src/assets/logo.generated.ts` from `src/assets/logo.png`; the app imports that module, so no separate logo asset is requested. The logo always loads in iframes. The app also uses `base: './'` in `vite.config.ts` so other asset paths are relative.

## Testing iframe embedding

After building and previewing (`npm run build` then `npm run preview`), open:

- **http://localhost:4173/iframe-test.html**

to verify the app (and logo) load correctly inside an iframe.

## Embedding the app

On craftedby.ai, embed the app with a normal iframe:

```html
<iframe
  src="https://your-woujamind-url.vercel.app/"
  title="Woujamind - Sprite Sheet Generator"
  allow="clipboard-write"
  style="width: 100%; height: 100vh; border: none;"
></iframe>
```

Because the app uses `base: './'`, the iframe `src` should point at the app root (trailing slash is fine).

- **`allow="clipboard-write"`** – Optional; only needed if you want paste (e.g. images) to work from the clipboard.
- **`sandbox`** – Do not add a restrictive `sandbox` (or omit `allow-same-origin`) if you want the app to use its own localStorage/IndexedDB for API keys and saved sprites; otherwise storage will not work.

## Adding more embedders

To allow another parent origin (e.g. a second domain), add it to the `frame-ancestors` value in `vercel.json`:

```json
"value": "frame-ancestors 'self' https://craftedby.ai https://*.craftedby.ai https://other-site.com"
```

Redeploy after changing `vercel.json`.
