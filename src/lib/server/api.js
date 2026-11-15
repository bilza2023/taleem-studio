// src/lib/server/backend/index.js
// THE API. One line per method: access level (+ course resolver) and handler.
// No logic here. Handlers live in ./handlers/*.js and have the signature run(input, ctx).

import { from } from "./access.js";

import * as user from "./modules/user.js";
import * as admin from "./modules/admin.js";
import * as course from "./modules/course.js";
import * as group from "./modules/group.js";
import * as library from "./modules/library.js";
import * as image from "./modules/image.js";
import * as audio from "./modules/audio.js";
import * as svg from "./modules/svg.js";
import * as assets from "./modules/assets.js";
import * as inquiry from "./modules/inquiry.js";
import * as notification from "./modules/notification.js";
import * as rating from "./modules/rating.js";
import * as hub from "./modules/hub.js";
import * as analytics from "./modules/analytics.js";
import * as mcqResult from "./modules/mcqResult.js";
import * as subscription from "./modules/subscription.js";

export const api = {
	// ── Identity ─────────────────────────────────────────
	user: {
		register:       { access: "public",  run: user.register },
		login:          { access: "public",  run: user.login },
		me:             { access: "student", run: user.me }
	},
	admin: {
		login:          { access: "public",  run: admin.login },
		me:             { access: "admin",   run: admin.me },
		list:           { access: "super",   run: admin.list },
		get:            { access: "super",   run: admin.get },
		create:         { access: "super",   run: admin.create },
		update:         { access: "super",   run: admin.update },
		delete:         { access: "super",   run: admin.remove },
		assignCourse:   { access: "super",   run: admin.assignCourse },
		unassignCourse: { access: "super",   run: admin.unassignCourse }
	},

	// ── Structure ────────────────────────────────────────
	course: {
		list:           { access: "public",  run: course.list },
		get:            { access: "public",  run: course.get },
		create:         { access: "super",   run: course.create },
		update:         { access: "super",   run: course.update },
		delete:         { access: "super",   run: course.remove }
	},
	group: {
		list:           { access: "public",  run: group.list },
		get:            { access: "public",  run: group.get },
		create:         { access: "super",   run: group.create },
		update:         { access: "super",   run: group.update },
		delete:         { access: "super",   run: group.remove },
		reorder:        { access: "super",   run: group.reorder }
	},

	// ── Content ──────────────────────────────────────────
	library: {
		get:            { access: "public",  run: library.get },          // drafts only if canTeach; paid rule inside
		list:           { access: "public",  run: library.list },         // filters; statuses depend on ctx
		studentList:    { access: "public",  run: library.studentList },  // published + drafts(dimmed), no archived
		create:         { access: "teacher", course: from.input,   run: library.create },
		update:         { access: "teacher", course: from.library, run: library.update },
		archive:        { access: "teacher", course: from.library, run: library.archive },
		delete:         { access: "super",   run: library.remove }
	},

	// ── Assets (global) ──────────────────────────────────
	image: {
		get:            { access: "public",  run: image.get },
		list:           { access: "public",  run: image.list },
		create:         { access: "admin",   run: image.create },
		update:         { access: "admin",   run: image.update },
		delete:         { access: "super",   run: image.remove }
	},
	audio: {
		get:            { access: "public",  run: audio.get },
		list:           { access: "public",  run: audio.list },
		create:         { access: "admin",   run: audio.create },
		update:         { access: "admin",   run: audio.update },
		delete:         { access: "super",   run: audio.remove }
	},
	svg: {
		get:            { access: "public",  run: svg.get },
		list:           { access: "public",  run: svg.list },
		create:         { access: "admin",   run: svg.create },
		update:         { access: "admin",   run: svg.update },
		delete:         { access: "super",   run: svg.remove },
		bulkCreate:     { access: "admin",   run: svg.bulkCreate }
	},
	assets: {
		list:           { access: "admin",   run: assets.list }
	},

	// ── Communication ────────────────────────────────────
	inquiry: {
		create:         { access: "student", run: inquiry.create },
		mine:           { access: "student", run: inquiry.mine },
		markRead:       { access: "student", run: inquiry.markRead },
		list:           { access: "teacher", course: from.input,   run: inquiry.list },
		get:            { access: "teacher", course: from.inquiry, run: inquiry.get },
		reply:          { access: "teacher", course: from.inquiry, run: inquiry.reply },
		setStatus:      { access: "teacher", course: from.inquiry, run: inquiry.setStatus },
		setTags:        { access: "teacher", course: from.inquiry, run: inquiry.setTags }
	},
	notification: {
		list:           { access: "super",   run: notification.list },
		create:         { access: "super",   run: notification.create },
		delete:         { access: "super",   run: notification.remove }
	},
	rating: {
		options:        { access: "public",  run: rating.options },
		save:           { access: "student", run: rating.save },
		mine:           { access: "student", run: rating.mine },
		summary:        { access: "teacher", course: from.input, run: rating.summary },
		list:           { access: "teacher", course: from.input, run: rating.list }
	},
	hub: {
		get:            { access: "student", run: hub.get }
	},

	// ── Analytics ────────────────────────────────────────
	analytics: {
		track:          { access: "public",  run: analytics.track },
		summary:        { access: "super",   run: analytics.summary }
	},
	mcqResult: {
		save:           { access: "public",  run: mcqResult.save },  // anonymous → { saved:false, reason:"login" }
		mine:           { access: "public",  run: mcqResult.mine }   // 401 inside if nobody is logged in
	},

	// ── Subscription (rules pending: canonical model) ────
	subscription: {
		mine:           { access: "student", run: subscription.mine },
		list:           { access: "super",   run: subscription.list },
		grant:          { access: "super",   run: subscription.grant },
		revoke:         { access: "super",   run: subscription.revoke }
	}
};