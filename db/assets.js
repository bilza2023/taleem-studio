
import kernel from 'taleem-kernel';

export async function listAssets() {
  const [images, svgs] = await Promise.all([
    kernel.image.list(),
    kernel.svg.list()
  ]);

  return [
    ...images.map(asset => ({ ...asset, type: 'IMAGE' })),
    ...svgs.map(asset => ({ ...asset, type: 'SVG' }))
  ];
}