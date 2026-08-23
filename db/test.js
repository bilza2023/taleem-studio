import kernel from 'taleem-kernel';

async function main() {
  const course = await kernel.course.create({
    slug: 'studio-test',
    title: 'Studio Test Course',
    description: 'Test course created by Taleem Studio'
  });

  console.log('Created:', course);

  console.log('Courses:', await kernel.course.list());
  console.log('Library:', await kernel.library.list());
  console.log('Images:', await kernel.image.list());
  console.log('SVGs:', await kernel.svg.list());
  console.log('Audio:', await kernel.audio.list());
}

main()
  .catch(console.error)
  .finally(() => kernel.shutdown());