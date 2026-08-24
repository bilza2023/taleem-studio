import kernel from 'taleem-kernel';
import syllabus from '../static/syllabus/index.js';

async function main() {
  console.log('Cleaning courses...');

  const courses = await kernel.course.list();

  for (const course of courses) {
    await kernel.course.delete(course.slug);
    console.log(`Deleted: ${course.slug}`);
  }

  console.log('\nCreating syllabus...');

  for (const [name, course] of Object.entries(syllabus)) {
    const created = await kernel.course.seed(course);
    console.log(`Created: ${created.slug}`);
  }
}

main()
  .catch(console.error)
  .finally(() => kernel.shutdown());