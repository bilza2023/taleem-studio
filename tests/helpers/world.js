// tests/helpers/world.js
// A small world in test.db: 2 courses, 1 group, 1 lesson, 1 student, 1 inquiry, 3 admins.
// Tokens are signed directly — no passwords involved.
// /home/bilal-tariq/00--TALEEM/taleem/tests/helpers/world.js
import { randomUUID } from "node:crypto";
import { db } from "$lib/server/db.js";
import { makeAdminToken, makeUserToken } from "$lib/server/auth.js";

// every name this world creates is derived from `run`
function names(run) {
	return {
		A: `t-course-a-${run}`,
		B: `t-course-b-${run}`,
		lessonSlug: `t-lesson-${run}`,
		emailTag: `-${run}@test.local`
	};
}

// delete everything belonging to one run, in foreign-key-safe order (safe on partial worlds)
async function cleanupRun(run) {
	const n = names(run);
	await db.inquiry.deleteMany({ where: { courseSlug: { in: [n.A, n.B] } } });
	await db.library.deleteMany({ where: { slug: n.lessonSlug } });
	await db.group.deleteMany({ where: { courseSlug: { in: [n.A, n.B] } } });
	await db.course.deleteMany({ where: { slug: { in: [n.A, n.B] } } });
	await db.user.deleteMany({ where: { email: { endsWith: n.emailTag } } });
	await db.admin.deleteMany({ where: { email: { endsWith: n.emailTag } } });
}

export async function createWorld() {
	const run = randomUUID().slice(0, 8);
	const { A, B, lessonSlug } = names(run);

	try {
		await db.course.create({ data: { slug: A, title: "Course A" } });
		await db.course.create({ data: { slug: B, title: "Course B" } });
		await db.group.create({ data: { courseSlug: A, slug: "g1", title: "Group 1" } });

		const lesson = await db.library.create({
			data: { slug: lessonSlug, courseSlug: A, groupSlug: "g1", type: "PLAYER", title: "Lesson", status: "PUBLISHED" }
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
			run,
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
	} catch (err) {
		await cleanupRun(run); // don't leave a half-built world behind
		throw err;
	}
}

// only what this world created; no-op if createWorld never finished
export async function destroyWorld(w) {
	if (!w) return;
	await cleanupRun(w.run);
}