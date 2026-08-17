# Cubs Road Sign Safari — Shared Cloudflare Version

This version uses:

- **Cloudflare Pages** for the webpage
- **Pages Functions** for the upload/gallery API
- **D1** for `who spotted it` + `what it means`
- **R2** for uploaded road-sign photos

## Files

- `index.html` — mobile-friendly Cubs page
- `functions/api/signs.js` — loads the gallery and accepts uploads
- `functions/images/[[key]].js` — serves photos from the private R2 bucket
- `schema.sql` — creates the D1 table
- `wrangler.toml` — example Cloudflare binding configuration

## Cloudflare setup

### 1. Create the D1 database

In Cloudflare:

**Workers & Pages → D1 SQL Database → Create database**

Name it:

`cubs-road-sign-safari`

Run the contents of `schema.sql` in the D1 Console.

If you prefer Wrangler:

```bash
npx wrangler d1 create cubs-road-sign-safari
npx wrangler d1 execute cubs-road-sign-safari --remote --file=./schema.sql
```

Copy the database ID Cloudflare gives you into `wrangler.toml`.

### 2. Create the R2 bucket

Go to:

**R2 Object Storage → Create bucket**

Name it:

`cubs-road-sign-photos`

The bucket does **not** need to be public. Photos are served through the Pages Function.

### 3. Create/deploy the Pages project

Create a Cloudflare Pages project for this folder.

If using the Cloudflare dashboard, upload the project from Git/GitHub so the `functions` folder is deployed with the site.

If using Wrangler, from this folder you can deploy with the current Pages deployment workflow supported by your Cloudflare account.

### 4. Add the bindings

Your Pages Functions need these exact binding names:

**D1 binding**
- Variable name: `DB`
- Database: `cubs-road-sign-safari`

**R2 binding**
- Variable name: `SIGN_PHOTOS`
- Bucket: `cubs-road-sign-photos`

In the Cloudflare dashboard, these are under your Pages project settings/bindings.

If you use `wrangler.toml`, the same names are already in the example config.

### 5. Test

Open the deployed site on your phone.

1. Take/select a road-sign photo.
2. Enter what it means.
3. Enter the Cub's first name/nickname.
4. Tap **Add My Road Sign**.
5. Open the same link on a different device.

The new sign should appear there too.

## Privacy / safety choices already included

- First name/nickname only is encouraged.
- The page asks users to avoid children's faces, house numbers and vehicle plates.
- Uploads are limited to common image types.
- Maximum photo size is 5 MB.
- The R2 bucket can remain private.
- The gallery returns only the newest 250 signs.

## Important public-upload note

Anyone who knows the page URL can currently upload a photo. For a one-evening Cubs activity this may be enough if the URL is only shared with your group, but a public upload endpoint can eventually attract spam.

A good next upgrade would be Cloudflare Turnstile or a simple event passcode.
