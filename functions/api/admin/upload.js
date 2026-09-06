import { json } from '../_middleware.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function onRequestPost(context) {
  const request = context.request;
  const contentType = request.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart form data' }, 400);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'general';

  if (!file || typeof file === 'string') {
    return json({ error: 'No file provided' }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' }, 400);
  }

  if (file.size > MAX_SIZE) {
    return json({ error: 'File too large. Maximum 5MB' }, 400);
  }

  const R2 = context.env.R2;
  if (!R2) {
    return json({ error: 'R2 storage not configured' }, 500);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  await R2.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  // Return just the key - frontend will use /api/image?key=KEY to display
  return json({ url: key, key: key });
}
