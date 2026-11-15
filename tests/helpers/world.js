// tests/helpers/world.js
// A small world in test.db: 2 courses, 1 group, 1 lesson, 1 student, 1 inquiry, 3 admins.
// Tokens are signed directly — no passwords involved.

import { db } from "$lib/server/db.js";
import { makeAdminToken, makeUserToken } from "$lib/server/auth.js";

export async function createWorld() {
	const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
	const A = `t-course-a-${run}`;
	const B = `t-course-b-${run}`;

	await db.course.create({ data: { slug: A, title: "Course A" } });
	await db.course.create({ data: { slug: B, title: "Course B" } });
	await db.group.create({ data: { courseSlug: A, slug: "g1", title: "Group 1" } });

	const lesson = await db.library.create({
		data: { slug: `t-lesson-${run}`, courseSlug: A, groupSlug: "g1", type: "PLAYER", title: "Lesson", status: "PUBLISHED" }
	});

	const student = await db.user.create({ data: { email: `t-student-${run}@test.local`, password: "x" } });
	const inquiry = await db.inquiry.create({ data: { userId: student.id, courseSlug: A, message: "hello" } });

	const teacherA = await db.admin.create({
		data: { email: `t-teacher-a-${run}@test.local`, password: "x", courseSlugs: JSON.stringify([A]) }
	});
	const teacherB = await db.admin.create({
		data: { email: `t-teacher-b-${run}@test.local`, password: "x", courseSlugs: JSON.stringify([B]) }
	});
	const superAdmin = await db.admin.create({
		data: { email: `t-super-${run}@test.local`, password: "x", role: "SUPER_ADMIN" }
	});

	return {
		A,
		B,
		lesson,
		student,
		inquiry,
		admins: [teacherA, teacherB, superAdmin],
		// what each actor sends
		actors: {
			anon: {},
			student: { userToken: makeUserToken(student) },
			teacherA: { adminToken: makeAdminToken(teacherA) },
			teacherB: { adminToken: makeAdminToken(teacherB) },
			super: { adminToken: makeAdminToken(superAdmin) }
		},
		// one input that satisfies every course resolver (from.input / from.library / from.inquiry)
		input: { courseSlug: A, slug: lesson.slug, id: inquiry.id }
	};
}

// delete in foreign-key-safe order; only what this world created
export async function destroyWorld(w) {
	await db.inquiry.deleteMany({ where: { id: w.inquiry.id } });
	await db.library.deleteMany({ where: { slug: w.lesson.slug } });
	await db.group.deleteMany({ where: { courseSlug: w.A } });
	await db.course.deleteMany({ where: { slug: { in: [w.A, w.B] } } });
	await db.user.deleteMany({ where: { id: w.student.id } });
	await db.admin.deleteMany({ where: { id: { in: w.admins.map((a) => a.id) } } });
}