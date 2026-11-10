
<script>
	// src/lib/editor/Nav.svelte
	import { SlideType } from "$lib/taleem-specs/enums";

	export let add;
	export let onDownload;
	export let onSave;
	export let onCollapseAll;

	const groups = [
		// Text
		[
			{ type: SlideType.TitleAndSubtitle, icon: "🅣" },
			{ type: SlideType.TitleAndPara, icon: "📄" },
			{ type: SlideType.BulletList, icon: "☰" },
			{ type: SlideType.TwoColumnText, icon: "⫷⫸" }
		],
		// Images
		[
			{ type: SlideType.ImageSlide, icon: "🖼️" },
			{ type: SlideType.FillImage, icon: "⬛" },
			{ type: SlideType.ImageWithTitle, icon: "🖼️🅣" },
			{ type: SlideType.ImageWithCaption, icon: "🖼️💬" },
			{ type: SlideType.ImageLeftBulletsRight, icon: "🖼️➡️" },
			{ type: SlideType.ImageRightBulletsLeft, icon: "⬅️🖼️" }
		],
		// Math / Data
		[
			{ type: SlideType.Eq, icon: "∑" },
			{ type: SlideType.Table, icon: "▦" },
			{ type: SlideType.BarChart, icon: "📊" },
			{ type: SlideType.ProgressBar, icon: "📈" }
		],
		// Special
		[
			{ type: SlideType.Quote, icon: "❝❞" },
			{ type: SlideType.KeyIdeas, icon: "💡" }
		]
	];

	// Shortcuts. Ctrl+C only collapses when NOT typing in a field,
	// so copying text from inputs / textareas keeps working.
	function onKey(e) {
		if (!(e.ctrlKey || e.metaKey)) return;

		if (e.key === "s") {
			e.preventDefault();
			onSave?.();
			return;
		}

		if (e.key === "c") {
			const el = document.activeElement;
			const typing =
				el?.tagName === "INPUT" ||
				el?.tagName === "TEXTAREA" ||
				el?.tagName === "SELECT" ||
				el?.isContentEditable;
			if (typing || window.getSelection()?.toString()) return;
			e.preventDefault();
			onCollapseAll?.();
		}
	}
</script>

<svelte:window on:keydown={onKey} />

<div class="nav">
	<div class="group">
		{#each groups as group, g}
			{#if g > 0}<span class="divider"></span>{/if}
			{#each group as button}
				<button on:click={() => add(button.type)} title={button.type}>
					{button.icon}
				</button>
			{/each}
		{/each}

		<span class="divider"></span>

		<!-- Actions -->
		<button on:click={onSave} title="Save (Ctrl+S)">💾</button>
		<button on:click={onDownload} title="Download deck.json">⬇</button>
		<button class="tools-button" on:click={onCollapseAll} title="Collapse / Expand All (Ctrl+C)">
			🪗
		</button>
	</div>
</div>

<style>
	.nav {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 8px 12px;
		box-sizing: border-box;
		background: #111827;
		border: 1px solid #2a3446;
		border-radius: 8px;
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		width: 100%;
	}

	.divider {
		width: 1px;
		height: 28px;
		background: #364258;
		margin: 0 6px;
	}

	button {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-size: 16px;
		background: #1c2435;
		color: white;
		border: 1px solid #324158;
		border-radius: 7px;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, transform 0.1s;
	}

	button:hover {
		background: #2b3952;
		border-color: #5fa8ff;
		transform: translateY(-1px);
	}

	button:active {
		transform: translateY(0);
	}

	.tools-button {
		background: #263449;
		border-color: #4b607c;
	}

	@media (max-width: 700px) {
		.nav {
			padding: 7px;
		}

		button {
			width: 34px;
			height: 34px;
			font-size: 15px;
		}

		.divider {
			margin: 0 3px;
		}
	}
</style>