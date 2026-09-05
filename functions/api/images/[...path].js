export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Get the path after /api/images/
  const key = url.pathname.replace('/api/images/', '');
  
  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const R2 = context.env.R2;
  if (!R2) {
    return new Response('R2 not configured', { status: 500 });
  }

  try {
    const object = await R2.get(key);
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new Response(object.body, { headers });
  } catch (err) {
    return new Response('Error loading image', { status: 500 });
  }
}
