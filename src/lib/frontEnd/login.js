
// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/frontEnd/login.js

import { http } from "./http/http.js";


export async function login(email, password) {
	return http.post("/signin", { email, password });
}