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
	createArticle, createPlayer, getLibrary, listLibrary,
	updateLibrary, deleteLibrary, listLibraryByGroup
} from "./library.js";
import {
	createSvg, getSvg, listSvg, updateSvg, deleteSvg
} from "./svg.js";

export const backend = {
	admin: {
		login: (data) => loginAdmin(data.email, data.password)
	},

	assets: {
		list: () => listAssets()
	},

	audio: {
		get: (data) => getAudio(data.slug),
		list: (data) => listAudio(data),
		create: (data) => createAudio(data),
		update: (data) => updateAudio(data.slug, data.data),
		delete: (data) => deleteAudio(data.slug)
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
		create: (data) => createImage(data),
		update: (data) => updateImage(data.slug, data.data),
		delete: (data) => deleteImage(data.slug)
	},

	library: {
		get: (data) => getLibrary(data.slug),
		list: (data) => listLibrary(data),
		update: (data) => updateLibrary(data.slug, data.data),
		delete: (data) => deleteLibrary(data.slug),
		createArticle: (data) => createArticle(data),
		createPlayer: (data) => createPlayer(data),
		listByGroup: (data) => listLibraryByGroup(data.courseSlug, data.groupSlug)
	},

	svg: {
		get: (data) => getSvg(data.slug),
		list: (data) => listSvg(data),
		create: (data) => createSvg(data),
		update: (data) => updateSvg(data.slug, data.data),
		delete: (data) => deleteSvg(data.slug)
	}
};