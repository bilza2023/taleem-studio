// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/server.js

import { loginAdmin } from "./admin.js";
import { listAssets } from "./assets.js";
import {
	listCourses, getCourse, getGroups, getGroup, getGroupItems
} from "./course.js";
import {
	createArticle, createPlayer, getLibrary, listLibrary, updateLibrary, deleteLibrary
} from "./library.js";
import {
	createSvg, getSvg, listSvg, updateSvg, deleteSvg
} from "./svg.js";
import {
	createImage, getImage, listImages, updateImage, deleteImage
} from "./image.js";

const backend = {
	admin: {
		login: (data) => loginAdmin(data.email, data.password)
	},
	assets: {
		list: () => listAssets()
	},
	course: {
		list: () => listCourses(),
		get: (data) => getCourse(data.slug),
		getGroups: (data) => getGroups(data.courseSlug),
		getGroup: (data) => getGroup(data.courseSlug, data.groupSlug),
		getGroupItems: (data) => getGroupItems(data.courseSlug, data.groupSlug)
	},
	library: {
		get: (data) => getLibrary(data.slug),
		list: (data) => listLibrary(data),
		update: (data) => updateLibrary(data.slug, data.data),
		delete: (data) => deleteLibrary(data.slug),
		createArticle: (data) => createArticle(data),
		createPlayer: (data) => createPlayer(data)
	},
	svg: {
		get: (data) => getSvg(data.slug),
		list: (data) => listSvg(data),
		create: (data) => createSvg(data),
		update: (data) => updateSvg(data.slug, data.data),
		delete: (data) => deleteSvg(data.slug)
	},
	image: {
		get: (data) => getImage(data.slug),
		list: (data) => listImages(data),
		create: (data) => createImage(data),
		update: (data) => updateImage(data.slug, data.data),
		delete: (data) => deleteImage(data.slug)
	}
};

export async function request({ method, module, data }) {
	method = method.toLowerCase();

	if (!backend[module]) {
		const err = new Error(`Unknown module: ${module}`);
		err.status = 404;
		throw err;
	}

	const handler = backend[module][method];

	if (!handler) {
		const err = new Error(`Method not implemented: ${module}.${method}`);
		err.status = 404;
		throw err;
	}

	return await handler(data);
}