import kernel from 'taleem-kernel';

export async function createImage(data) {
  return kernel.image.create(data);
}

export async function getImage(slug) {
  return kernel.image.get(slug);
}

export async function listImages(filters) {
  return kernel.image.list(filters);
}

export async function updateImage(slug, data) {
  return kernel.image.update(slug, data);
}

export async function deleteImage(slug) {
  return kernel.image.delete(slug);
}