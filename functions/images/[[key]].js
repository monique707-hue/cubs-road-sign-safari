export async function onRequestGet(context) {
  const raw = context.params.key;
  const key = Array.isArray(raw) ? raw.join("/") : raw;

  if (!key) return new Response("Not found", { status: 404 });

  const object = await context.env.SIGN_PHOTOS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");

  return new Response(object.body, { headers });
}
