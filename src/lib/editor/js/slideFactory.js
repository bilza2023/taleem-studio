import { SlideType } from "$lib/taleem-specs/enums";

export const slideFactory = {

	[SlideType.TitleAndSubtitle]: () => ({
		type: SlideType.TitleAndSubtitle,
		data: [
			{ name: "title", content: "", showAt: 0 },
			{ name: "subtitle", content: "", showAt: 0 }
		]
	}),

	[SlideType.TitleAndPara]: () => ({
		type: SlideType.TitleAndPara,
		data: [
			{ name: "title", content: "", showAt: 0 },
			{ name: "para", content: "", showAt: 0 }
		]
	}),

	[SlideType.BulletList]: () => ({
		type: SlideType.BulletList,
		data: [
			{ name: "heading", content: "", showAt: 0 },
			{ name: "bullet", content: "", showAt: 0 }
		]
	}),

	[SlideType.TwoColumnText]: () => ({
		type: SlideType.TwoColumnText,
		data: [
			{ name: "left", content: "", showAt: 0 },
			{ name: "right", content: "", showAt: 0 }
		]
	}),

	[SlideType.ImageSlide]: () => ({
		type: SlideType.ImageSlide,
		data: [
			{ name: "image", content: "", showAt: 0 }
		]
	}),

	[SlideType.FillImage]: () => ({
		type: SlideType.FillImage,
		data: [
			{ name: "image", content: "", showAt: 0 }
		]
	}),

	[SlideType.ImageWithTitle]: () => ({
		type: SlideType.ImageWithTitle,
		data: [
			{ name: "title", content: "", showAt: 0 },
			{ name: "image", content: "", showAt: 0 }
		]
	}),

	[SlideType.ImageWithCaption]: () => ({
		type: SlideType.ImageWithCaption,
		data: [
			{ name: "image", content: "", showAt: 0 },
			{ name: "caption", content: "", showAt: 0 }
		]
	}),

	[SlideType.ImageLeftBulletsRight]: () => ({
		type: SlideType.ImageLeftBulletsRight,
		data: [
			{ name: "image", content: "", showAt: 0 },
			{ name: "bullet", content: "", showAt: 0 }
		]
	}),

	[SlideType.ImageRightBulletsLeft]: () => ({
		type: SlideType.ImageRightBulletsLeft,
		data: [
			{ name: "image", content: "", showAt: 0 },
			{ name: "bullet", content: "", showAt: 0 }
		]
	}),

	[SlideType.KeyIdeas]: () => ({
		type: SlideType.KeyIdeas,
		data: [
			{ name: "card", icon: "🧠", label: "", showAt: 0 },
			{ name: "card", icon: "📘", label: "", showAt: 0 },
			{ name: "card", icon: "🧩", label: "", showAt: 0 },
			{ name: "card", icon: "🎯", label: "", showAt: 0 }
		]
	}),

	[SlideType.Quote]: () => ({
		type: SlideType.Quote,
		data: [
			{ name: "quote", content: "", showAt: 0 },
			{ name: "author", content: "", showAt: 0 }
		]
	}),

	[SlideType.Table]: () => ({
		type: SlideType.Table,
		data: [
			["Column A", "Column B"],
			["", ""]
		]
	}),

	[SlideType.BarChart]: () => ({
		type: SlideType.BarChart,
		data: [
			{ name: "bar", label: "A", value: 0, showAt: 0 }
		]
	}),

	[SlideType.ProgressBar]: () => ({
		type: SlideType.ProgressBar,
		data: [
			{ name: "bar", label: "Progress", value: 0, showAt: 0 }
		]
	}),

	[SlideType.Eq]: () => ({
		type: SlideType.Eq,
		data: []
	})

};