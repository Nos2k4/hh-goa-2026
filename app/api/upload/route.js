import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const id = nanoid(10);
    const blob = await put(`shares/${id}.png`, file, {
      access: 'public',
      contentType: 'image/png',
    });

    return Response.json({ url: blob.url, id });
  } catch (err) {
    console.error('upload error', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
