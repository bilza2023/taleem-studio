
import { json } from '@sveltejs/kit';
import { mkdir, writeFile, access, unlink } from 'node:fs/promises';
import path from 'node:path';
import { config } from '$lib/config.js';

const AUDIO_DIR = path.join(config.contentDir, 'audio');

export async function POST({ request }) {
  let filePath;

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) return json({ error: 'Audio file is required' }, { status: 400 });
    if (!file.type.startsWith('audio/')) return json({ error: 'File must be audio' }, { status: 400 });

    const filename = path.basename(file.name);
    if (!filename) return json({ error: 'Invalid filename' }, { status: 400 });

    filePath = path.join(AUDIO_DIR, filename);

    try {
      await access(filePath);
      return json({ error: `File already exists: ${filename}` }, { status: 409 });
    } catch {}

    await mkdir(AUDIO_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return json({
      slug: filename,
      title: form.get('title') || filename,
      tags: form.get('tags') || '[]'
    }, { status: 201 });

  } catch (error) {
    console.error(error);

    if (filePath) {
      try { await unlink(filePath); } catch {}

    return json({ error: error.message }, { status: 400 });
  }
  }}