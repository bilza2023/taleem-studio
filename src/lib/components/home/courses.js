// src/lib/components/home/courses.js
// Single source for course sale data — used by ClassesSection (cards) and Navbar (dropdown).
// tag / highlights are display-only — edit freely.

export const courses = [
	{
		slug: "fbise8math",
		title: "Class 8 Math",
		subject: "Mathematics · FBISE",
		description: "Build strong foundations before the board years.",
		image: "fbise8math.svg",
		access: "open",
		price: { year: 8000, half: 5000 },
		highlights: ["Every exercise question solved", "Narrated slide lessons", "MCQs & notes"]
	},
	{
		slug: "fbise9math",
		title: "Class 9 Math",
		subject: "Mathematics · FBISE · SSC-I",
		description: "First board year — master every concept and question.",
		image: "fbise9math.svg",
		access: "open",
		tag: "Most popular",
		price: { year: 8000, half: 5000 },
		highlights: ["Every exercise question solved", "Narrated slide lessons", "Board exam prep"]
	},
	{
		slug: "fbise10math",
		title: "Class 10 Math",
		subject: "Mathematics · FBISE · SSC-II",
		description: "Strengthen concepts and walk into the board exam ready.",
		image: "fbise10math.svg",
		access: "open",
		price: { year: 8000, half: 5000 },
		highlights: ["Every exercise question solved", "Narrated slide lessons", "Board exam prep"]
	}
];

export const rs = (n) => "Rs " + Number(n).toLocaleString("en-PK");