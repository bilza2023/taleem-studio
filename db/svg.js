import kernel from 'taleem-kernel';

export async function createSvg(data) {
  return kernel.svg.create(data);
}

export async function listSvg() {
  return kernel.svg.list();
}