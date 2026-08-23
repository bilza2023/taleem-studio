///home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/db/library.js
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
export async function listLibrary() {
  return kernel.library.list();
}