export async function onRequest(context) {
  const url = new URL(context.request.url);
  let key = url.searchParams.get('key');
  
  if (!key) {
    return new Response('Missing key parameter', { status: 400 });
  }

  // If key is a full URL, redirect to it
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return Response.redirect(key, 302);
  }

  // Remove leading slash if present
  if (key.startsWith('/')) {
    key = key.substring(1);
  }

  const R2 = context.env.R2;
  if (!R2) {
    return new Response('R2 not configured', { status: 500 });
  }

  try {
    const object = await R2.get(key);
    if (!object) {
      return new Response('Image not found: ' + key, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(object.body, { headers });
  } catch (err) {
    return new Response('Error: ' + err.message, { status: 500 });
  }
}
