// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend.js

import { loginAdmin, authenticateAdmin, authorizeAdmin,listAdmins, getAdmin, createAdmin, updateAdmin, deleteAdmin, assignCourseToAdmin, unassignCourseFromAdmin } from "./admin.js";
import { listAssets,getAsset } from "../assets.js";

import {createAudio, getAudio, listAudio, updateAudio, deleteAudio} from "./audio.js";
import {listCourses, getCourse, createCourse, updateCourse, deleteCourse, authorizeCourse} from "./course.js";
import {listGroups, getGroup, createGroup, updateGroup, deleteGroup} from "./group.js";
import {createImage, getImage, listImages, updateImage, deleteImage} from "./image.js";
import {createLibrary, getLibrary, listLibrary, updateLibrary, deleteLibrary, listLibraryByGroup
} from "./library.js";

import {createSvg, getSvg, listSvg, updateSvg, deleteSvg} from "./svg.js";

export const backend = {

	admin: {
		login: (data) => loginAdmin(data.email, data.password),
		authenticate: (data, token) => authenticateAdmin(token),
		authorize: (data) => authorizeAdmin(data.email, data.courseSlug),
		list: (data, token) => listAdmins(data, token),
		get: (data, token) => getAdmin(data.email, token),
		create: (data, token) => createAdmin(data, token),
		update: (data, token) => updateAdmin(data.email, data.data, token),
		delete: (data, token) => deleteAdmin(data.email, token),
		assignCourse: (data, token) => assignCourseToAdmin(data.email, data.courseSlug, token),
		unassignCourse: (data, token) => unassignCourseFromAdmin(data.email, data.courseSlug, token)
	},

	assets: {
		list: (data, token) => listAssets(token),
		get: (data) => getAsset(data.slug)
	},

	audio: {
		get: (data) => getAudio(data.slug),
		list: (data) => listAudio(data),
		create: (data, token) => createAudio(data, token),
		update: (data, token) => updateAudio(data.slug, data.data, token),
		delete: (data, token) => deleteAudio(data.slug, token)
	},

	course: {
		list: (data) => listCourses(data),
		get: (data) => getCourse(data.slug),
		create: (data, token) => createCourse(data, token),
		update: (data, token) => updateCourse(data.slug, data.data, token),
		delete: (data, token) => deleteCourse(data.slug, token),
		authorize: (data) => authorizeCourse(data.userId, data.courseSlug)
	},

	group: {
		list: (data) => listGroups(data.courseSlug),
		get: (data) => getGroup(data.courseSlug, data.groupSlug),
		create: (data, token) => createGroup(data, token),
		update: (data, token) => updateGroup(data.courseSlug, data.groupSlug, data.data, token),
		delete: (data, token) => deleteGroup(data.courseSlug, data.groupSlug, token)
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
		create: (data) => createLibrary(data),
		update: (data) => updateLibrary(data.slug, data.data),
		delete: (data) => deleteLibrary(data.slug),
		listByGroup: (data) => listLibraryByGroup(data.courseSlug, data.groupSlug)
	},

	svg: {
		get: (data) => getSvg(data.slug),
		list: (data) => listSvg(data.slug),
		create: (data, token) => createSvg(data, token),
		update: (data, token) => updateSvg(data.slug, data.data, token),
		delete: (data, token) => deleteSvg(data.slug, token)
	}
};