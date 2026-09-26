// /home/bilal-tariq/00--TALEEM/taleem-kernel/src/modules/Admin.js

import bcrypt from "bcrypt";
import JWT from "../utils/JWT.js";

export default class Admin {
	constructor(kernel) {
		this.kernel = kernel;
		this.jwt = new JWT(kernel);
	}

	async list(filters = {}) {
		const where = {};
		if (filters.isActive !== undefined) where.isActive = filters.isActive;
		return this.kernel.db.admin.findMany({ where });
	}

	async get(email) {
		return this.kernel.db.admin.findUnique({ where: { email } });
	}

	// Authentication

	async login(email, password) {
		const admin = await this.get(email);

		if (!admin) {
			throw new Error(`Admin.login(): Admin '${email}' not found.`);
		}

		if (!admin.isActive) {
			throw new Error(`Admin.login(): Admin '${email}' is inactive.`);
		}

		const ok = await bcrypt.compare(password, admin.password);

		if (!ok) {
			throw new Error(`Admin.login(): Invalid password.`);
		}

		return this.createToken(admin);
	}

	async createToken(admin) {
		return this.jwt.sign({
			email: admin.email,
			type: "admin"
		});
	}

	async authenticate(token) {
		const payload = this.jwt.verify(token);

		if (payload.type !== "admin") {
			throw new Error("Admin token required.");
		}

		const admin = await this.get(payload.email);

		if (!admin) {
			throw new Error("Admin not found.");
		}

		if (!admin.isActive) {
			throw new Error("Admin is inactive.");
		}

		return admin;
	}

	// CRUD

	async create(data) {
		const createData = { ...data };

		if (createData.password) {
			createData.password = await bcrypt.hash(createData.password, 10);
		}

		return this.kernel.db.admin.create({
			data: createData
		});
	}

	async update(email, data) {
		const updateData = { ...data };

		if (updateData.password) {
			updateData.password = await bcrypt.hash(updateData.password, 10);
		}

		return this.kernel.db.admin.update({
			where: { email },
			data: updateData
		});
	}

	async delete(email) {
		return this.kernel.db.admin.delete({
			where: { email }
		});
	}

	async isAdmin(email, courseSlug) {
		const admin = await this.get(email);

		if (!admin) return false;

		const courseSlugs = JSON.parse(admin.courseSlugs || "[]");

		return courseSlugs.includes(courseSlug);
	}
		async isSuperAdmin(email) {
		const admin = await this.get(email);

		if (!admin) return false;

		return admin.role === "SUPER_ADMIN";
	}
		async assignCourse(email, courseSlug) {
		const admin = await this.get(email);

		if (!admin) {
			throw new Error(`Admin.assignCourse(): Admin '${email}' not found.`);
		}

		const course = await this.kernel.course.get(courseSlug);

		if (!course) {
			throw new Error(`Admin.assignCourse(): Course '${courseSlug}' not found.`);
		}

		const courseSlugs = JSON.parse(admin.courseSlugs || "[]");

		if (!courseSlugs.includes(courseSlug)) {
			courseSlugs.push(courseSlug);
		}

		return this.update(email, { courseSlugs: JSON.stringify(courseSlugs) });
	}

	async unassignCourse(email, courseSlug) {
		const admin = await this.get(email);

		if (!admin) {
			throw new Error(`Admin.unassignCourse(): Admin '${email}' not found.`);
		}

		const courseSlugs = JSON.parse(admin.courseSlugs || "[]");
		const updated = courseSlugs.filter((slug) => slug !== courseSlug);

		return this.update(email, { courseSlugs: JSON.stringify(updated) });
	}
}