// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/frontEnd/svg.js

import { http } from "./http/http.js";

export async function createSvg(data) {
	return http.post("/svg", data);
}

export async function getSvg(slug) {
	return http.get(`/svg/${slug}`);
}

export async function listSvg(filters) {
	return http.post("/svg/list", filters);
}

export async function updateSvg(slug, data) {
	return http.put(`/svg/${slug}`, data);
}

export async function deleteSvg(slug) {
	return http.delete(`/svg/${slug}`);
}