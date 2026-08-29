// src/lib/server/assets.js
import kernel from 'taleem-kernel';

export async function listAssets() {
  const [images, svgs, audios] = await Promise.all([
    kernel.image.list(),
    kernel.svg.list(),
    kernel.audio.list()
  ]);

  return [
    ...images.map(asset => ({ ...asset, type: 'IMAGE' })),
    ...svgs.map(asset => ({ ...asset, type: 'SVG' })),
    ...audios.map(asset => ({ ...asset, type: 'AUDIO' }))
  ];
}