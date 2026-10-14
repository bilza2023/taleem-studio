<script>
	import { onMount } from "svelte";
	import { WHATSAPP_NUMBER } from "$lib/admission.js";

	let {
		courseTitle,
		mode = "Online",
		label = "Enroll on WhatsApp",
		variant = "primary" // "primary" | "secondary"
	} = $props();

	let email = $state("");

	function refresh() {
		email = localStorage.getItem("taleem-email") || "";
	}

	onMount(() => {
		refresh();
		window.addEventListener("authChanged", refresh);
		return () => window.removeEventListener("authChanged", refresh);
	});

	let href = $derived.by(() => {
		const lines = [
			`Assalam o Alaikum. I want admission in ${courseTitle} (${mode}).`,
			email
				? `My Taleem account: ${email}`
				: "I don't have a Taleem account yet."
		];
		return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
	});
</script>

<a class="enroll {variant}" {href} target="_blank" rel="noopener noreferrer">
	{label}
</a>

<style>
	.enroll {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.7rem 1.2rem;
		border-radius: 10px;
		font-weight: 600;
		text-decoration: none;
		transition: transform 0.15s ease, filter 0.15s ease, background 0.2s ease;
	}

	.primary {
		background: #f5b82e;
		color: #1a1a1a;
	}

	.primary:hover {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.secondary {
		background: transparent;
		color: var(--theme-text);
		border: 1px solid var(--theme-border);
	}

	.secondary:hover {
		background: color-mix(in srgb, var(--theme-accent) 15%, transparent);
	}

	.enroll:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
	}
</style>