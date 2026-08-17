const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function cleanText(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function extensionFor(type) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif"
  }[type] || "bin";
}

export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, spotted_by, meaning, image_key, created_at
       FROM signs
       ORDER BY created_at DESC
       LIMIT 250`
    ).all();

    return json(results.map(row => ({
      id: row.id,
      spotted_by: row.spotted_by,
      meaning: row.meaning,
      image_url: `/images/${row.image_key}`,
      created_at: row.created_at
    })));
  } catch (error) {
    console.error(error);
    return json({ error: "Could not load the gallery." }, 500);
  }
}

export async function onRequestPost(context) {
  let form;
  try {
    form = await context.request.formData();
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }

  const photo = form.get("photo");
  const meaning = cleanText(form.get("meaning"), 180);
  const spottedBy = cleanText(form.get("spottedBy"), 50);

  if (!(photo instanceof File) || photo.size === 0) {
    return json({ error: "Please choose a photo." }, 400);
  }
  if (!meaning) return json({ error: "Please tell us what you think the sign means." }, 400);
  if (!spottedBy) return json({ error: "Please tell us who spotted it." }, 400);
  if (photo.size > MAX_FILE_SIZE) return json({ error: "The photo must be smaller than 5 MB." }, 413);
  if (!ALLOWED_TYPES.has(photo.type)) return json({ error: "Please upload a JPG, PNG, WebP, HEIC or HEIF photo." }, 415);

  const id = crypto.randomUUID();
  const ext = extensionFor(photo.type);
  const imageKey = `${new Date().toISOString().slice(0, 10)}/${id}.${ext}`;

  try {
    await context.env.SIGN_PHOTOS.put(imageKey, photo.stream(), {
      httpMetadata: { contentType: photo.type },
      customMetadata: { uploadId: id }
    });

    try {
      await context.env.DB.prepare(
        `INSERT INTO signs (id, spotted_by, meaning, image_key, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(id, spottedBy, meaning, imageKey, new Date().toISOString()).run();
    } catch (dbError) {
      await context.env.SIGN_PHOTOS.delete(imageKey);
      throw dbError;
    }

    return json({
      ok: true,
      sign: {
        id,
        spotted_by: spottedBy,
        meaning,
        image_url: `/images/${imageKey}`
      }
    }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "We could not save that road sign. Please try again." }, 500);
  }
}

export function onRequest(context) {
  return json({ error: "Method not allowed." }, 405);
}
