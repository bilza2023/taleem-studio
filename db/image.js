import kernel from 'taleem-kernel';

export async function createImage(data) {
  return kernel.image.create(data);
}

export async function listImages() {
  return kernel.image.list();
}