<script>
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";
	import { getPlayHref, displayTitle, timeAgo } from "$lib/utils/cards.js";

	let hub = $state(null);
	let error = $state("");
	let loading = $state(true);
	let loggedOut = $state(false);

	// ---------- courses: colour + title lookup ----------
	const PILL_COLORS = ["teal", "purple", "gold", "blue", "rose"];
	let colorOf = $derived.by(() => {
		const map = {};
		(hub?.courses ?? []).forEach((c, i) => (map[c.slug] = PILL_COLORS[i % PILL_COLORS.length]));
		return map;
	});
	let titleOf = $derived(Object.fromEntries((hub?.courses ?? []).map((c) => [c.slug, c.title])));

	let firstName = $derived(hub?.user?.name?.trim() || hub?.user?.email?.split("@")[0] || "there");

	// ---------- "N new things since last visit" ----------
	let newCount = $derived.by(() => {
		if (!hub) return 0;
		const since = hub.lastVisitAt ? new Date(hub.lastVisitAt) : null;
		const newAnn = since
			? hub.announcements.filter((a) => new Date(a.publishAt) > since).length
			: hub.announcements.length;
		return hub.newItems.length + newAnn + hub.unreadReplies;
	});

	// ---------- new items grouped by course ----------
	let newByCourse = $derived.by(() => {
		const groups = new Map();
		for (const item of hub?.newItems ?? []) {
			if (!groups.has(item.courseSlug)) groups.set(item.courseSlug, []);
			groups.get(item.courseSlug).push(item);
		}
		return [...groups.entries()];
	});

	// ---------- load ----------
	$effect(() => {
		if (!localStorage.getItem("taleem-token")) {
			loggedOut = true;
			loading = false;
			return;
		}
		send("hub", "get", {}, "user")
			.then((r) => {
				hub = r;
				if (r.unreadReplies > 0) {
					// the student has now seen them; badge clears next visit
					send("inquiry", "markRead", {}, "user").catch(() => {});
				}
			})
			.catch((e) => (error = e?.message ?? String(e)))
			.finally(() => (loading = false));

		send("rating", "options", {}, "user")
			.then((o) => (ratingOptions = o ?? []))
			.catch(() => {});
	});

	function courseHref(slug) {
		return `${config.basePath}/course?course=${encodeURIComponent(slug)}`;
	}

	// ---------- rating (for the last watched deck) ----------
	let ratingOptions = $state([]);
	let rateStars = $state(0);
	let rateOptions = $state([]);
	let rateComment = $state("");
	let rateSaving = $state(false);
	let rateDone = $state(false);
	let rateError = $state("");

	function toggleOption(key) {
		rateOptions = rateOptions.includes(key)
			? rateOptions.filter((k) => k !== key)
			: [...rateOptions, key];
	}

	async function saveRating(deck) {
		if (!rateStars) {
			rateError = "Pick a star rating first.";
			return;
		}
		rateSaving = true;
		rateError = "";
		try {
			await send("rating", "save", {
				librarySlug: deck.slug,
				stars: rateStars,
				options: rateOptions,
				comment: rateComment
			}, "user");
			rateDone = true;
			// reflect in recently watched
			hub.recentlyWatched = hub.recentlyWatched.map((r) =>
				r.slug === deck.slug ? { ...r, myStars: rateStars } : r
			);
		} catch (e) {
			rateError = e?.message ?? "Could not save rating.";
		} finally {
			rateSaving = false;
		}
	}

	// ---------- send a message ----------
	let composing = $state(false);
	let draft = $state("");
	let sending = $state(false);
	let sendError = $state("");

	async function sendMessage() {
		if (!draft.trim()) {
			sendError = "Write a message first.";
			return;
		}
		sending = true;
		sendError = "";
		try {
			const created = await send("inquiry", "create", { message: draft }, "user");
			hub.messages = [created, ...hub.messages].slice(0, 5);
			draft = "";
			composing = false;
		} catch (e) {
			sendError = e?.message ?? "Could not send.";
		} finally {
			sending = false;
		}
	}
</script>

{#snippet pill(courseSlug)}
	<a class="pill {colorOf[courseSlug] ?? 'teal'}" href={courseHref(courseSlug)}>
		{titleOf[courseSlug] ?? courseSlug}
	</a>
{/snippet}

{#snippet sourcePill(a)}
	{#if a.audience === "COURSE"}
		{@render pill(a.courseSlug)}
	{:else if a.audience === "USER"}
		<span class="pill blue">For you</span>
	{:else}
		<span class="pill gold">Taleem.help</span>
	{/if}
{/snippet}

{#snippet deckCard(card, label, primary)}
	<div class="deck">
		<p class="muted small">{label}</p>
		<p class="deck-title" title={card.title}>{displayTitle(card)}</p>
		<a class="btn {primary ? 'btn-primary' : 'btn-ghost'}" href={getPlayHref(card)} data-sveltekit-reload>
			{primary ? "▶ Resume" : "Start"}
		</a>
	</div>
{/snippet}

<main class="hub">
	{#if loading}
		<p class="muted">Loading your hub…</p>

	{:else if loggedOut}
		<section class="panel center">
			<h2 class="serif">Your hub</h2>
			<p class="muted">Log in to see your lessons, progress and messages.</p>
			<a class="btn btn-primary" href={`${config.basePath}/login`}>Log in</a>
		</section>

	{:else if error}
		<section class="panel center"><p class="error">{error}</p></section>

	{:else}
		<!-- ===== greeting ===== -->
		<header class="greet">
			<div class="greet-top">
				<div>
					<h1 class="serif">Welcome back, {firstName}</h1>
					<p class="muted">
						{#if hub.lastVisitAt}Last visit {timeAgo(hub.lastVisitAt)}{:else}Welcome to your hub{/if}
						{#if newCount > 0}· <span class="gold-text">{newCount} new {newCount === 1 ? "thing" : "things"}</span>{/if}
					</p>
				</div>
				<button class="btn btn-ghost" onclick={() => (composing = true)}>✉ Send a message</button>
			</div>
			{#if hub.courses.length}
				<div class="courses">
					<span class="muted small">Your courses</span>
					{#each hub.courses as c (c.slug)}{@render pill(c.slug)}{/each}
				</div>
			{/if}
		</header>

		<!-- ===== continue / start here ===== -->
		{#if hub.continue}
			{@const last = hub.continue.last}
			{@const next = hub.continue.next}
			<section class="panel accent">
				<div class="panel-head">
					<h2>▶ Continue</h2>
					{@render pill(last.courseSlug)}
				</div>
				<div class="two">
					{@render deckCard(last, `Last watched · ${timeAgo(last.lastOpenedAt)}`, true)}
					{#if next}{@render deckCard(next, "Up next", false)}{/if}
				</div>

				<!-- rate the last watched deck (only if not rated yet) -->
				{#if !last.myStars && !rateDone}
					<div class="rate">
						<div class="rate-row">
							<span class="muted">How was <span class="serif white">{displayTitle(last)}</span>?</span>
							<span class="stars">
								{#each [1, 2, 3, 4, 5] as n}
									<button
										class="star"
										class:on={n <= rateStars}
										onclick={() => { rateStars = n; rateError = ""; }}
										aria-label={`${n} star${n > 1 ? "s" : ""}`}
									>★</button>
								{/each}
							</span>
						</div>

						{#if rateStars}
							<div class="rate-more">
								{#if ratingOptions.length}
									<div class="chips">
										{#each ratingOptions as o (o.key)}
											<button
												class="chip"
												class:on={rateOptions.includes(o.key)}
												onclick={() => toggleOption(o.key)}
											>{o.label}</button>
										{/each}
									</div>
								{/if}
								<input
									class="input"
									maxlength="300"
									placeholder="What would you like us to improve?"
									bind:value={rateComment}
								/>
								<button class="btn btn-primary" disabled={rateSaving} onclick={() => saveRating(last)}>
									{rateSaving ? "Saving…" : "Save rating"}
								</button>
							</div>
						{/if}
						{#if rateError}<p class="error small">{rateError}</p>{/if}
					</div>
				{:else if rateDone}
					<div class="rate"><p class="muted small">Thanks — your rating helps us improve this lesson.</p></div>
				{/if}
			</section>

		{:else if hub.startHere.length}
			<section class="panel accent">
				<div class="panel-head"><h2>✨ Start here</h2></div>
				<div class="two">
					{#each hub.startHere as card (card.slug)}
						<div class="deck">
							{@render pill(card.courseSlug)}
							<p class="deck-title" title={card.title}>{displayTitle(card)}</p>
							<a class="btn btn-primary" href={getPlayHref(card)} data-sveltekit-reload>▶ Start</a>
						</div>
					{/each}
				</div>
			</section>

		{:else}
			<section class="panel center">
				<h2 class="serif">Let's get you started</h2>
				<p class="muted">Pick a course to begin — new lessons go live every day.</p>
				<a class="btn btn-primary" href={`${config.basePath}/`}>Browse courses</a>
			</section>
		{/if}

		<!-- ===== messages + announcements ===== -->
		{#if composing || hub.messages.length || hub.announcements.length}
			<div class="side-by-side">
				<!-- messages -->
				<section class="panel" class:blue-border={hub.unreadReplies > 0}>
					<div class="panel-head">
						<h2>✉ Your messages</h2>
						{#if hub.unreadReplies > 0}
							<span class="pill blue">{hub.unreadReplies} {hub.unreadReplies === 1 ? "reply" : "replies"}</span>
						{/if}
					</div>

					{#if composing}
						<div class="compose">
							<textarea
								class="input"
								rows="3"
								maxlength="1000"
								placeholder="Ask the Taleem team anything — you can send 2 messages a week."
								bind:value={draft}
								oninput={() => (sendError = "")}
							></textarea>
							{#if sendError}<p class="error small">{sendError}</p>{/if}
							<div class="compose-actions">
								<button class="btn btn-ghost" onclick={() => { composing = false; sendError = ""; }}>Cancel</button>
								<button class="btn btn-primary" disabled={sending} onclick={sendMessage}>
									{sending ? "Sending…" : "Send"}
								</button>
							</div>
						</div>
					{/if}

					{#each hub.messages as m (m.id)}
						<div class="msg">
							<p class="msg-text">{m.message}</p>
							{#if m.status === "ANSWERED"}
								<p class="small blue-text" class:unread={!m.replyReadAt}>
									Answered · {timeAgo(m.repliedAt)}
								</p>
								<p class="reply">{m.reply}</p>
							{:else}
								<p class="muted small">{m.status === "CLOSED" ? "Closed" : "Open"} · {timeAgo(m.createdAt)}</p>
							{/if}
						</div>
					{:else}
						{#if !composing}<p class="muted small">No messages yet.</p>{/if}
					{/each}
				</section>

				<!-- announcements -->
				<section class="panel">
					<div class="panel-head"><h2>📢 Announcements</h2></div>
					{#each hub.announcements as a (a.id)}
						<div class="msg">
							<p class="msg-text">
								{#if a.link}<a class="link" href={a.link}>{a.title}</a>{:else}{a.title}{/if}
							</p>
							{#if a.body}<p class="muted small">{a.body}</p>{/if}
							<div class="meta">
								{@render sourcePill(a)}
								<span class="muted small">{timeAgo(a.publishAt)}</span>
							</div>
						</div>
					{:else}
						<p class="muted small">No announcements right now.</p>
					{/each}
				</section>
			</div>
		{/if}

		<!-- ===== new in your courses ===== -->
		{#if hub.newItems.length}
			<section class="panel">
				<div class="panel-head">
					<h2>✨ New in your courses</h2>
					<span class="pill green">{hub.newItems.length} new</span>
				</div>
				{#each newByCourse as [courseSlug, items] (courseSlug)}
					<div class="course-group">{@render pill(courseSlug)}</div>
					{#each items as item (item.slug)}
						<a class="row" href={getPlayHref(item)} data-sveltekit-reload>
							<span class="dot"></span>
							<span class="row-title" title={item.title}>{displayTitle(item)} is now live</span>
							<span class="muted small when">{timeAgo(item.publishedAt)}</span>
						</a>
					{/each}
				{/each}
			</section>
		{/if}

		<!-- ===== recently watched ===== -->
		{#if hub.recentlyWatched.length}
			<section class="panel">
				<div class="panel-head"><h2>Recently watched</h2></div>
				{#each hub.recentlyWatched as item (item.slug)}
					<a class="row" href={getPlayHref(item)} data-sveltekit-reload>
						<span class="row-title" title={item.title}>{displayTitle(item)}</span>
						{#if item.myStars}<span class="gold-text small">★ {item.myStars}</span>{/if}
						{@render pill(item.courseSlug)}
						<span class="muted small when">{timeAgo(item.lastOpenedAt)}</span>
					</a>
				{/each}
			</section>
		{/if}
	{/if}
</main>

<style>
	.hub {
		max-width: 1280px;
		margin: 0 auto;
		padding: 2rem 2rem 3rem;
		color: var(--theme-text, #e8eefb);
	}

	.serif { font-family: Georgia, "Times New Roman", serif; font-weight: 500; }
	.muted { color: #9fb0cf; margin: 0; }
	.small { font-size: .78rem; }
	.white { color: #fff; }
	.gold-text { color: #f5b82e; }
	.blue-text { color: #60a5fa; margin: .25rem 0 0; }
	.error { color: #f87171; margin: .4rem 0 0; }

	/* greeting */
	.greet { margin-bottom: 1.25rem; }
	.greet-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.greet h1 { margin: 0 0 .3rem; font-size: 1.8rem; color: #fff; }
	.courses { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin-top: .9rem; }

	/* panels */
	.panel {
		background: #16233f;
		border: 1px solid rgba(255, 255, 255, .12);
		border-radius: 12px;
		padding: 1rem 1.15rem;
		margin-bottom: 1rem;
	}
	.panel.accent { border: 1.5px solid #3b82f6; }
	.panel.blue-border { border-color: rgba(96, 165, 250, .5); }
	.panel.center { text-align: center; padding: 2rem 1rem; }
	.panel.center h2 { margin: 0 0 .5rem; color: #fff; }
	.panel.center .btn { margin-top: 1rem; }

	.panel-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .75rem; }
	.panel-head h2 { margin: 0; font-size: 1.05rem; font-weight: 500; color: #fff; }

	.side-by-side {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.side-by-side .panel { margin-bottom: 0; }

	/* deck cards */
	.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: .75rem; }
	.deck {
		display: flex; flex-direction: column; align-items: flex-start; gap: .4rem;
		padding: .9rem 1rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, .15);
		background: linear-gradient(180deg, #34573c 0%, #2a4631 100%);
	}
	.deck .muted { color: #c7dccb; }
	.deck-title {
		margin: 0 0 .35rem;
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.1rem; line-height: 1.35; color: #fff;
		display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
	}

	/* rating */
	.rate { margin-top: .9rem; padding-top: .8rem; border-top: 1px solid rgba(255, 255, 255, .08); }
	.rate-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; font-size: .9rem; }
	.stars { display: inline-flex; gap: .15rem; }
	.star {
		all: unset; cursor: pointer;
		font-size: 1.35rem; line-height: 1;
		color: rgba(245, 184, 46, .35);
		transition: color .12s ease, transform .12s ease;
	}
	.star.on { color: #f5b82e; }
	.star:hover { transform: scale(1.15); color: #f5b82e; }
	.rate-more { display: flex; flex-direction: column; align-items: flex-start; gap: .6rem; margin-top: .75rem; }
	.chips { display: flex; flex-wrap: wrap; gap: .4rem; }
	.chip {
		all: unset; cursor: pointer;
		padding: .25rem .75rem; border-radius: 999px; font-size: .8rem;
		border: 1px solid rgba(255, 255, 255, .25); color: #dfe6f5;
	}
	.chip.on { background: #10b981; border-color: #10b981; color: #fff; }

	/* inputs */
	.input {
		width: 100%; box-sizing: border-box; margin: 0;
		background: #0f1a33; color: #e8eefb;
		border: 1px solid rgba(255, 255, 255, .18); border-radius: 8px;
		padding: .55rem .75rem; font: inherit; font-size: .9rem;
	}
	.input:focus { outline: none; border-color: #3b82f6; }

	/* buttons */
	.btn {
		display: inline-block; width: auto; margin: 0;
		padding: .45rem 1.1rem; border-radius: 999px;
		font-size: .85rem; font-weight: 600; text-decoration: none; cursor: pointer;
	}
	.btn-primary { background: #10b981; color: #fff; border: none; }
	.btn-primary:hover { filter: brightness(1.1); }
	.btn-primary:disabled { opacity: .6; cursor: default; }
	.btn-ghost { background: transparent; border: 1px solid rgba(255, 255, 255, .35); color: #fff; }
	.btn-ghost:hover { background: rgba(255, 255, 255, .06); }

	/* messages / announcements */
	.compose { display: flex; flex-direction: column; gap: .5rem; margin-bottom: .75rem; }
	.compose-actions { display: flex; justify-content: flex-end; gap: .5rem; }
	.msg { padding: .65rem 0; border-top: 1px solid rgba(255, 255, 255, .08); }
	.msg:first-of-type { border-top: none; }
	.msg-text { margin: 0; color: #fff; font-size: .9rem; }
	.reply {
		margin: .4rem 0 0; padding: .5rem .7rem;
		background: rgba(59, 130, 246, .1); border-left: 2px solid #3b82f6; border-radius: 0;
		font-size: .85rem; color: #dfe6f5;
	}
	.unread { font-weight: 600; }
	.meta { display: flex; align-items: center; gap: .5rem; margin-top: .35rem; }
	.link { color: #fff; text-decoration: underline; text-decoration-color: rgba(255, 255, 255, .3); }

	/* rows */
	.course-group { margin: .75rem 0 .25rem; }
	.course-group:first-of-type { margin-top: 0; }
	.row {
		display: flex; align-items: center; gap: .75rem;
		padding: .65rem .25rem;
		border-top: 1px solid rgba(255, 255, 255, .08);
		color: #dfe6f5; text-decoration: none; font-size: .9rem;
	}
	.row:hover { background: rgba(255, 255, 255, .04); }
	.row-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.when { width: 80px; text-align: right; flex-shrink: 0; }
	.dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0; }

	/* pills */
	.pill {
		display: inline-block; padding: .12rem .65rem; border-radius: 999px;
		font-size: .72rem; font-weight: 500; white-space: nowrap; text-decoration: none;
		flex-shrink: 0; max-width: 220px; overflow: hidden; text-overflow: ellipsis;
	}
	.pill.teal   { background: #0d3b3a; color: #5eead4; border: 1px solid rgba(94, 234, 212, .35); }
	.pill.purple { background: #2e1f5e; color: #c4b5fd; border: 1px solid rgba(196, 181, 253, .35); }
	.pill.gold   { background: #3a2c0a; color: #fcd34d; border: 1px solid rgba(252, 211, 77, .35); }
	.pill.blue   { background: #10284f; color: #93c5fd; border: 1px solid rgba(147, 197, 253, .35); }
	.pill.rose   { background: #4a1530; color: #fda4af; border: 1px solid rgba(253, 164, 175, .35); }
	.pill.green  { background: #064e3b; color: #6ee7b7; border: 1px solid rgba(110, 231, 183, .35); }
</style>