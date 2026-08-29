// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend.js

import { loginAdmin } from "./admin.js";
import { listAssets } from "./assets.js";
import {
	createAudio, getAudio, listAudio, updateAudio, deleteAudio
} from "./audio.js";
import {
	listCourses, getCourse, getGroups, getGroup, getGroupItems
} from "./course.js";
import {
	createImage, getImage, listImages, updateImage, deleteImage
} from "./image.js";
import {
	createLibrary, getLibrary, listLibrary,
	updateLibrary, deleteLibrary, listLibraryByGroup
} from "./library.js";
import { getPendingContent } from "./pending.js";
import {
	createSvg, getSvg, listSvg, updateSvg, deleteSvg
} from "./svg.js";

export const backend = {
	admin: {
		login: (data) => loginAdmin(data.email, data.password)
	},

	assets: {
		list: (data, token) => listAssets(token)
	},

	audio: {
		get: (data) => getAudio(data.slug),
		list: (data) => listAudio(data),
		create: (data, token) => createAudio(data, token),
		update: (data, token) => updateAudio(data.slug, data.data, token),
		delete: (data, token) => deleteAudio(data.slug, token)
	},

	course: {
		list: () => listCourses(),
		get: (data) => getCourse(data.slug),
		getGroups: (data) => getGroups(data.slug),
		getGroup: (data) => getGroup(data.slug, data.groupSlug),
		getGroupItems: (data) => getGroupItems(data.slug, data.groupSlug)
	},

	image: {
		get: (data) => getImage(data.slug),
		list: (data) => listImages(data),
		create: (data, token) => createImage(data, token),
		update: (data, token) => updateImage(data.slug, data.data, token),
		delete: (data, token) => deleteImage(data.slug, token)
	},

	library: {
	get: (data) => getLibrary(data.slug),
	list: (data) => listLibrary(data),
	create: (data, token) => createLibrary(data, token),
	update: (data, token) => updateLibrary(data.slug, data.data, token),
	delete: (data, token) => deleteLibrary(data.slug, token),
	listByGroup: (data) => listLibraryByGroup(data.courseSlug, data.groupSlug)
},

	pending: {
		get: (data, token) => getPendingContent(data.courseSlug, token)
	},

	svg: {
		get: (data) => getSvg(data.slug),
		list: (data) => listSvg(data),
		create: (data, token) => createSvg(data, token),
		update: (data, token) => updateSvg(data.slug, data.data, token),
		delete: (data, token) => deleteSvg(data.slug, token)
	}
};