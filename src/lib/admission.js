// src/lib/admission.js
// All admission-page content lives here. Edit text, prices and seats in this file only.

export const WHATSAPP_NUMBER = "923339724440"; // international format, no + or spaces
export const PHONE_DISPLAY = "0333-9724440";
export const CAMPUS_ADDRESS =
	"River View Junction, Bahria Town Phase 8, Rawalpindi (in front of Dominion Mall)";
export const REPLY_HOURS = "TODO: e.g. 10am – 8pm, Monday to Saturday";

export const courses = [
	{
		slug: "class-8-math",
		title: "Class 8 Math",
		subtitle: "Federal Board · New curriculum",
		price: 5000,
		duration: "1 year",
		includes: [
			"Every exercise question explained step by step",
			"Updates and new lessons included",
			"Your own questions answered"
		],
		sampleHref: null // e.g. "/blog/app/samples" — hidden when null
	},
	{
		slug: "class-9-math",
		title: "Class 9 Math",
		subtitle: "Federal Board · New curriculum",
		price: 5000,
		duration: "1 year",
		includes: [
			"Every exercise question explained step by step",
			"Updates and new lessons included",
			"Your own questions answered"
		],
		sampleHref: null
	},
	{
		slug: "class-10-math",
		title: "Class 10 Math",
		subtitle: "Federal Board · New curriculum",
		price: 5000,
		duration: "1 year",
		includes: [
			"Every exercise question explained step by step",
			"Updates and new lessons included",
			"Your own questions answered"
		],
		sampleHref: null
	}
];

export const onCampus = {
	enabled: true,
	title: "On-campus classes",
	tag: "First batches only",
	seatsText: "Limited seats", // TODO: or "12 seats left"
	points: [
		"2 months of classes at our Bahria Town Phase 8 campus",
		"Taught alongside your online course",
		"Seats are confirmed on WhatsApp before payment"
	]
};

export const steps = [
	{ title: "Message us", text: "Tap Enroll on WhatsApp. Your class and account are filled in for you." },
	{ title: "Seat confirmed", text: "We reply with your seat and payment details." },
	{ title: "Pay", text: "Pay through Easypaisa, JazzCash or bank, and send the screenshot." },
	{ title: "Start learning", text: "Your course opens on your Taleem.help account." }
];

export const paymentMethods = ["Easypaisa", "JazzCash", "Bank transfer"];

export const faqs = [
	{
		q: "Do I need to sign up first?",
		a: "Yes, please. Sign up on Taleem.help before messaging us, so we know which account to open your course on."
	},
	{
		q: "How do I pay?",
		a: "After we confirm your seat on WhatsApp, we send our Easypaisa / JazzCash / bank details. Pay, then send the screenshot on the same chat."
	},
	{
		q: "How long until my course opens?",
		a: "TODO: e.g. within 24 hours of receiving your payment screenshot."
	},
	{
		q: "Is there a monthly plan?",
		a: "No. Every course is for one full year, so you can use it for every test and exam in that class."
	},
	{
		q: "What happens after one year?",
		a: "You can extend for another year at a very small fee."
	},
	{
		q: "Are updates and new lessons included?",
		a: "Yes. Lessons are improved regularly, and every improvement is included in your fee."
	},
	{
		q: "Can I share my account?",
		a: "One account is for one student."
	},
	{
		q: "What is included in on-campus classes?",
		a: "Two months of classes at our Bahria Town Phase 8 campus, for the first batches only. Ask on WhatsApp for fee and timings."
	},
	{
		q: "What if I paid for the wrong class?",
		a: "TODO: e.g. message us within 7 days and we will switch your course."
	}
];