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
    const data = {
      ...course,
      groupings: JSON.stringify(course.groupings ?? [])
    };

    const created = await kernel.course.create(data);
    console.log(`Created: ${created.slug}`);
  }

//   console.log('\nCourses:', await kernel.course.list());
}

main()
  .catch(console.error)
  .finally(() => kernel.shutdown());