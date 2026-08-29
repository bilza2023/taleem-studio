
import { http } from "../index.js";

import * as course from "./course.js";
import * as library from "./library.js";


http.addRoute("course", "get", course.getCourse);
http.addRoute("course", "list", course.listCourses);
http.addRoute("course", "getGroups", course.getGroups);
http.addRoute("course", "getGroup", course.getGroup);
http.addRoute("course", "getGroupItems", course.getGroupItems);

http.addRoute("library", "get", library.getLibrary);
http.addRoute("library", "list", library.listLibrary);
http.addRoute("library", "post", library.createArticle);

const backend = http.getBackEnd();
export { backend };