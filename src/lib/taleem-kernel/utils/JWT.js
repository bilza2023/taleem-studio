// /home/bilal-tariq/00--TALEEM/taleem-kernel/src/utils/JWT.js

import jwt from "jsonwebtoken";

export default class JWT {

	constructor(kernel) {

		this.kernel = kernel;

	}

	sign(payload) {

		return jwt.sign(
			payload,
			this.kernel.config.jwtSecret
		);

	}

	verify(token) {

		return jwt.verify(
			token,
			this.kernel.config.jwtSecret
		);

	}

}