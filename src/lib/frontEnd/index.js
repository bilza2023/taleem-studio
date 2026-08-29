// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/frontEnd/index.js

import { send } from "./send.js";

export const frontend = {
	course: {
		list: () => send("course", "list"),
		get: (slug) => send("course", "get", { slug }),
		getGroups: (courseSlug) => send("course", "getGroups", { courseSlug }),
		getGroup: (courseSlug, groupSlug) =>
			send("course", "getGroup", { courseSlug, groupSlug }),
		getGroupItems: (courseSlug, groupSlug) =>
			send("course", "getGroupItems", { courseSlug, groupSlug })
	},
	pending: {
	get: (courseSlug) => send("pending", "get", { courseSlug })
},

	library: {
	get: (slug) => send("library", "get", { slug }),
	list: (filters) => send("library", "list", filters),
	create: (data) => send("library", "create", data),
	update: (slug, data) => send("library", "update", { slug, data }),
	delete: (slug) => send("library", "delete", { slug }),
	listByGroup: (courseSlug, groupSlug) =>
		send("library", "listByGroup", { courseSlug, groupSlug })
},

	svg: {
		list: () => send("svg", "list"),
		get: (slug) => send("svg", "get", { slug }),
		create: (data) => send("svg", "create", data),
		update: (slug, data) => send("svg", "update", { slug, data }),
		delete: (slug) => send("svg", "delete", { slug })
	},

	image: {
		list: () => send("image", "list"),
		get: (slug) => send("image", "get", { slug }),
		create: (data) => send("image", "create", data),
		update: (slug, data) => send("image", "update", { slug, data }),
		delete: (slug) => send("image", "delete", { slug })
	},

	audio: {
		list: () => send("audio", "list"),
		get: (slug) => send("audio", "get", { slug }),
		create: (data) => send("audio", "create", data),
		update: (slug, data) => send("audio", "update", { slug, data }),
		delete: (slug) => send("audio", "delete", { slug })
	},

	assets: {
		list: () => send("assets", "list")
	},

	admin: {
		login: (email, password) => send("admin", "login", { email, password })
	}
};