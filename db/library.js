import kernel from 'taleem-kernel';

export async function createArticle(data) {
  return kernel.library.create({
    ...data,
    type: 'ARTICLE'
  });
}

export async function createPlayer(data) {
  return kernel.library.create({
    ...data,
    type: 'PLAYER'
  });
}

export async function getLibrary(slug) {
  return kernel.library.get(slug);
}

export async function listLibrary(filters) {
  return kernel.library.list(filters);
}

export async function updateLibrary(slug, data) {
  return kernel.library.update(slug, data);
}

export async function deleteLibrary(slug) {
  return kernel.library.delete(slug);
}