// src/serverKernel/ServerKernel.js

import { PrismaClient } from "@prisma/client";
import Config from "./Config.js";
// import Auth from "./Auth.js";
import CommunicationPolicy from "./CommunicationPolicy.js";
import User from "./modules/User.js";
import Admin from "./modules/Admin.js";
import Library from "./modules/Library.js";
import Course from "./modules/Course.js";
import Group from "./modules/Group.js";
import Communication from "./modules/Communication.js";
import Subscription from "./modules/Subscription.js";
import Image from "./modules/Image.js";
import Audio from "./modules/Audio.js";
import Svg from "./modules/Svg.js";

class ServerKernel {
	constructor() {
		this.config = new Config();
		this.db = new PrismaClient();
		// this.auth = new Auth(this);
		this.communicationPolicy = new CommunicationPolicy(this);
		this.user = new User(this);
		this.admin = new Admin(this);
		this.library = new Library(this);
		this.course = new Course(this);
		this.group = new Group(this);
		this.image = new Image(this);
		this.audio = new Audio(this);
		this.svg = new Svg(this);
		this.communication = new Communication(this);
		this.subscription = new Subscription(this);
	}

	async shutdown() {
		await this.db.$disconnect();
	}
}

const kernel = new ServerKernel();

export default kernel;