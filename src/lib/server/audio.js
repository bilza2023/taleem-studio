import kernel from 'taleem-kernel';

export async function createAudio(data) {
  return kernel.audio.create(data);
}

export async function getAudio(slug) {
  return kernel.audio.get(slug);
}

export async function listAudio(filters) {
  return kernel.audio.list(filters);
}

export async function updateAudio(slug, data) {
  return kernel.audio.update(slug, data);
}

export async function deleteAudio(slug) {
  return kernel.audio.delete(slug);
}