import kernel from 'taleem-kernel';
import admins from '../static/admins/admins.json' with { type: 'json' };

async function main() {
  console.log('Cleaning admins...');

  const existing = await kernel.admin.list();

  for (const admin of existing) {
    await kernel.admin.delete(admin.email);
    console.log(`Deleted: ${admin.email}`);
  }

  console.log('\nCreating admins...');

  for (const admin of admins) {
    const created = await kernel.admin.create({
      email: admin.email,
      password: admin.password,
      role: admin.role,
      courseSlugs: JSON.stringify(admin.courses ?? [])
    });

    console.log(`Created: ${created.email}`);
  }

//   console.log('\nAdmins:', await kernel.admin.list());
}

main()
  .catch(console.error)
  .finally(() => kernel.shutdown());