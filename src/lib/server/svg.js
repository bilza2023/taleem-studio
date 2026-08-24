import kernel from 'taleem-kernel';

export async function createSvg(data) {
  return kernel.svg.create(data);
}

export async function getSvg(slug) {
  return kernel.svg.get(slug);
}

export async function listSvg(filters) {
  return kernel.svg.list(filters);
}

export async function updateSvg(slug, data) {
  return kernel.svg.update(slug, data);
}

export async function deleteSvg(slug) {
  return kernel.svg.delete(slug);
}