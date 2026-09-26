// src/serverKernel/modules/User.js

import bcrypt from "bcrypt";
import JWT from "../utils/JWT.js";

export default class User {
	constructor(kernel) {
		this.kernel = kernel;
		this.jwt = new JWT(kernel);
	}

	// Queries

	async list() {
		return this.kernel.db.user.findMany();
	}

	async get(id) {
		return this.kernel.db.user.findUnique({ where: { id } });
	}

	async getByEmail(email) {
		return this.kernel.db.user.findUnique({ where: { email } });
	}

	async emailToId(email) {
		const user = await this.getByEmail(email);
		if (!user) throw new Error(`User '${email}' not found.`);
		return user.id;
	}

	// Authentication

	async register(data) {
		const password = await bcrypt.hash(data.password, 10);

		return this.kernel.db.user.create({
			data: { ...data, password }
		});
	}

	async login(email, password) {
		const user = await this.getByEmail(email);

		if (!user) {
			throw new Error(`User.login(): User '${email}' not found.`);
		}

		const ok = await bcrypt.compare(password, user.password);

		if (!ok) {
			throw new Error(`User.login(): Invalid password.`);
		}

		return this.createToken(user);
	}

	async createToken(user) {
		return this.jwt.sign({
			id: user.id,
			type: "user"
		});
	}

	async authenticate(token) {
		const payload = this.jwt.verify(token);

		if (payload.type !== "user") {
			throw new Error("User token required.");
		}

		const user = await this.get(payload.id);

		if (!user) {
			throw new Error("User not found.");
		}

		return user;
	}

	// CRUD

	async update(id, data) {
		const updateData = { ...data };

		if (updateData.password) {
			updateData.password = await bcrypt.hash(updateData.password, 10);
		}

		return this.kernel.db.user.update({
			where: { id },
			data: updateData
		});
	}

	async delete(id) {
		return this.kernel.db.user.delete({
			where: { id }
		});
	}
}