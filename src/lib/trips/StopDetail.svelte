<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import { currentUser, pb } from '$lib/pocketbase';
	import Lightbox from './Lightbox.svelte';
	import LazyImg from './LazyImg.svelte';
	import Reactions from '$lib/social/Reactions.svelte';
	import Comments from '$lib/social/Comments.svelte';
	import type { Stop } from './types';

	type Props = {
		stops: Stop[];
		index: number;
		onClose: () => void;
		onEdit?: (stop: Stop) => void;
	};

	let { stops, index = $bindable(), onClose, onEdit }: Props = $props();

	const stop = $derived(stops[index]);
	const hasPrev = $derived(index > 0);
	const hasNext = $derived(index < stops.length - 1);

	function prev() { if (hasPrev) { sheetEl?.scrollTo({ top: 0 }); index--; } }
	function next() { if (hasNext) { sheetEl?.scrollTo({ top: 0 }); index++; } }

	let sheetEl: HTMLDivElement | undefined = $state();
	let fileToken = $state('');
	let lightbox = $state<{ urls: string[]; index: number } | null>(null);

	const photoUrls = $derived(
		stop.photos?.map((p) => fileUrl(p, '1200x1200f', false)) ?? []
	);
	const receiptUrls = $derived(
		stop.receipts?.map((r) => fileUrl(r, '1200x1200f', true)) ?? []
	);

	function openLightbox(urls: string[], index: number) {
		lightbox = { urls, index };
	}

	// Gas math: find the previous gas stop with an odometer reading to compute
	// miles driven and MPG for this leg.
	const prevGasStop = $derived.by(() => {
		if (stop.type !== 'gas' || !stop.odometer) return null;
		for (let i = index - 1; i >= 0; i--) {
			const s = stops[i];
			if (s.type === 'gas' && s.odometer && s.odometer > 0) return s;
		}
		return null;
	});

	const milesDriven = $derived(
		prevGasStop ? stop.odometer - prevGasStop.odometer : null
	);

	const legMpg = $derived(
		milesDriven && stop.gallons ? milesDriven / stop.gallons : null
	);

	const costPerMile = $derived(
		milesDriven && stop.total_cost ? stop.total_cost / milesDriven : null
	);

	const TYPE_LABEL: Record<string, string> = {
		gas: 'gas',
		sightseeing: 'sightseeing',
		hotel: 'hotel',
		food: 'food',
		rest: 'rest stop',
		other: 'stop'
	};

	function fileUrl(filename: string, thumb?: string, withToken = false) {
		const params: string[] = [];
		if (thumb) params.push(`thumb=${thumb}`);
		if (withToken && fileToken) params.push(`token=${fileToken}`);
		const qs = params.length ? `?${params.join('&')}` : '';
		return `${PUBLIC_POCKETBASE_URL}/api/files/${stop.collectionId}/${stop.id}/${filename}${qs}`;
	}

	const BOOKMARKS_KEY = 'bookmarked-stops';

	function getBookmarks(): Set<string> {
		try {
			return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'));
		} catch { return new Set(); }
	}

	let bookmarked = $state(false);

	// Re-check bookmark state when stop changes.
	$effect(() => {
		bookmarked = getBookmarks().has(stop.id);
	});

	function toggleBookmark() {
		const set = getBookmarks();
		if (set.has(stop.id)) {
			set.delete(stop.id);
			bookmarked = false;
		} else {
			set.add(stop.id);
			bookmarked = true;
		}
		localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
	}

	async function share() {
		const title = stop.name || 'Stop';
		const url = `${window.location.origin}/map#stop-${stop.id}`;
		try {
			await navigator.share({ title, url });
		} catch {
			// user cancelled or share not supported
		}
	}

	function compass(deg: number) {
		const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
		return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
	}

	function fmtDate(iso: string) {
		if (!iso) return '';
		const d = new Date(iso.replace(' ', 'T'));
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function handleKey(e: KeyboardEvent) {
		if (lightbox) return; // let Lightbox handle keys when open
		if (e.key === 'Escape') onClose();
		else if (e.key === 'ArrowLeft') prev();
		else if (e.key === 'ArrowRight') next();
	}

	// Mint a file token so admin can view the protected receipts.
	$effect(() => {
		if ($currentUser?.admin && stop.receipts?.length > 0 && !fileToken) {
			pb.files.getToken().then((t) => (fileToken = t)).catch(() => {});
		}
	});
</script>

<svelte:window onkeydown={handleKey} />

<div
	class="backdrop"
	transition:fade={{ duration: 150 }}
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="presentation"
>
	<div
		class="sheet"
		bind:this={sheetEl}
		transition:fly={{ y: 40, duration: 200 }}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="stop-detail-title"
		tabindex="-1"
	>
		{#if stops.length > 1}
			<nav class="stop-nav">
				<button type="button" class="nav-btn" onclick={prev} disabled={!hasPrev} aria-label="Previous stop">
					<span class="nav-arrow">‹</span> prev
				</button>
				<span class="nav-counter">{index + 1} / {stops.length}</span>
				<button type="button" class="nav-btn" onclick={next} disabled={!hasNext} aria-label="Next stop">
					next <span class="nav-arrow">›</span>
				</button>
			</nav>
		{/if}

		<div class="head">
			<div class="drag-handle"></div>
			<div class="title-block">
				<span class="text-meta">
					{TYPE_LABEL[stop.type] ?? stop.type} · {fmtDate(stop.timestamp || stop.created)}
				</span>
				<h2 id="stop-detail-title">{stop.name || 'Untitled stop'}</h2>
				{#if stop.address}
					<p class="address">{stop.address}</p>
				{/if}
			</div>
			<div class="head-actions">
				<button
					type="button"
					class="icon-btn"
					class:bookmarked
					onclick={toggleBookmark}
					aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark stop'}
					title={bookmarked ? 'Saved' : 'Save'}
				>{bookmarked ? '★' : '☆'}</button>
				<button type="button" class="icon-btn" onclick={share} aria-label="Share stop" title="Share">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
				</button>
				<a
					href="https://maps.apple.com/?daddr={stop.lat},{stop.lng}"
					target="_blank"
					rel="noopener noreferrer"
					class="icon-btn"
					aria-label="Get directions"
					title="Directions"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
				</a>
				{#if $currentUser?.admin && onEdit}
					<button type="button" class="icon-btn" onclick={() => onEdit(stop)} aria-label="Edit stop" title="Edit">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
					</button>
				{/if}
				<button type="button" onclick={onClose} aria-label="Close" class="x">×</button>
			</div>
		</div>

		{#if stop.photos?.length > 0}
			<div class="photos">
				{#each stop.photos as photo, i}
					<button
						type="button"
						class="photo"
						onclick={() => openLightbox(photoUrls, i)}
						aria-label="View photo {i + 1}"
					>
						<LazyImg src={fileUrl(photo, '300x300f')} />
					</button>
				{/each}
			</div>
		{/if}

		{#if stop.videos?.length > 0}
			<div class="videos">
				{#each stop.videos as video}
					<div class="video-wrap">
						<video
							src={fileUrl(video)}
							controls
							playsinline
							preload="metadata"
							class="video-player"
						></video>
						<a href={fileUrl(video)} download class="download-link">download video</a>
					</div>
				{/each}
			</div>
		{/if}

		{#if stop.type === 'gas'}
			<dl class="gas">
				{#if stop.odometer}
					<div><dt>Odometer</dt><dd>{stop.odometer.toLocaleString()} mi</dd></div>
				{/if}
				{#if milesDriven !== null}
					<div><dt>Miles driven</dt><dd>{milesDriven.toLocaleString()} mi</dd></div>
				{/if}
				{#if stop.gallons}
					<div><dt>Gallons</dt><dd>{stop.gallons.toFixed(2)}</dd></div>
				{/if}
				{#if stop.price_per_gallon}
					<div><dt>$/gal</dt><dd>${stop.price_per_gallon.toFixed(3)}</dd></div>
				{/if}
				{#if stop.total_cost}
					<div><dt>Total</dt><dd>${stop.total_cost.toFixed(2)}</dd></div>
				{/if}
				{#if legMpg !== null}
					<div><dt>MPG</dt><dd>{legMpg.toFixed(1)}</dd></div>
				{/if}
				{#if costPerMile !== null}
					<div><dt>$/mile</dt><dd>${costPerMile.toFixed(2)}</dd></div>
				{/if}
			</dl>
		{/if}

		{#if stop.notes}
			<p class="notes">{stop.notes}</p>
		{/if}

		{#if $currentUser?.admin && stop.receipts?.length > 0}
			<section class="receipts">
				<h3 class="text-meta">Receipts & odometer <em>(private)</em></h3>
				<div class="photos">
					{#each stop.receipts as r, i}
						<button
							type="button"
							class="photo"
							onclick={() => openLightbox(receiptUrls, i)}
							aria-label="View receipt {i + 1}"
							disabled={!fileToken}
						>
							<LazyImg src={fileUrl(r, '300x300f', true)} />
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if stop.altitude !== null && stop.altitude !== undefined && stop.altitude !== 0}
			{@const ft = Math.round(stop.altitude * 3.28084)}
			<section class="gps">
				<h3 class="text-meta">GPS</h3>
				<dl>
					<div>
						<dt>Elevation</dt>
						<dd>{ft.toLocaleString()} ft <span class="sub">({Math.round(stop.altitude)} m)</span></dd>
					</div>
					{#if stop.accuracy}
						<div><dt>Accuracy</dt><dd>±{stop.accuracy.toFixed(0)} m</dd></div>
					{/if}
					{#if stop.altitude_accuracy}
						<div><dt>Vertical ±</dt><dd>{stop.altitude_accuracy.toFixed(0)} m</dd></div>
					{/if}
					{#if stop.heading !== null && stop.heading !== undefined && !isNaN(stop.heading) && stop.heading !== 0}
						<div><dt>Heading</dt><dd>{Math.round(stop.heading)}° {compass(stop.heading)}</dd></div>
					{/if}
					{#if stop.speed !== null && stop.speed !== undefined && !isNaN(stop.speed) && stop.speed > 0}
						<div><dt>Speed</dt><dd>{(stop.speed * 2.23694).toFixed(1)} mph</dd></div>
					{/if}
				</dl>
			</section>
		{/if}

		<section class="social">
			<Reactions targetCollection="stops" targetId={stop.id} />
		</section>

		<section class="social">
			<h3 class="text-meta">Comments</h3>
			<Comments targetCollection="stops" targetId={stop.id} />
		</section>

		<div class="coords text-meta">
			{stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
		</div>
	</div>
</div>

{#if lightbox}
	<Lightbox
		urls={lightbox.urls}
		bind:index={lightbox.index}
		onClose={() => (lightbox = null)}
	/>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.65);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	@media (min-width: 720px) {
		.backdrop {
			align-items: center;
		}
	}

	.sheet {
		width: 100%;
		max-width: 32rem;
		max-height: 92dvh;
		overflow-y: auto;
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 12px 12px 0 0;
		padding: 1rem 1.25rem 1.5rem;
		padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (min-width: 720px) {
		.sheet {
			border-radius: 8px;
			max-height: 85dvh;
		}
	}

	.head {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.drag-handle {
		position: absolute;
		top: -0.3rem;
		left: 50%;
		transform: translateX(-50%);
		width: 2.5rem;
		height: 0.25rem;
		border-radius: 999px;
		background: var(--color-border);
	}

	@media (min-width: 720px) {
		.drag-handle {
			display: none;
		}
	}

	.title-block {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.4rem;
	}

	.title-block h2 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.7rem;
		line-height: 1.15;
		margin: 0;
	}

	.address {
		color: var(--color-muted);
		font-size: 0.9rem;
		margin: 0;
	}

	.head-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.2rem;
	}

	.videos {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.video-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.video-player {
		width: 100%;
		border-radius: 4px;
		background: #000;
	}

	.download-link {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
		text-decoration: none;
		align-self: flex-end;
	}
	.download-link:hover {
		color: var(--color-accent);
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		color: var(--color-muted);
		border: 0;
		border-radius: 3px;
		padding: 0.4rem;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		text-decoration: none;
	}
	.icon-btn:hover {
		color: var(--color-accent);
		background: rgba(255, 176, 112, 0.08);
	}
	.icon-btn.bookmarked {
		color: var(--color-accent);
	}

	.x {
		background: transparent;
		border: 0;
		color: var(--color-muted);
		font-size: 1.6rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}
	.x:hover {
		color: var(--color-text);
	}

	.photos {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}

	.photo {
		display: block;
		overflow: hidden;
		border-radius: 4px;
		background: var(--color-surface-2);
		padding: 0;
		border: 0;
		cursor: pointer;
		appearance: none;
	}

	.photo:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.photo:hover:not(:disabled) {
		transform: scale(1.03);
		transition: transform 0.2s ease;
	}

	.gas {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		background: var(--color-surface-2);
		border-radius: 4px;
		margin: 0;
	}

	.gas div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.gas dt {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.gas dd {
		font-family: var(--font-display);
		font-size: 1.25rem;
		margin: 0;
	}

	.notes {
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--color-text);
		white-space: pre-wrap;
		margin: 0;
	}

	.receipts h3 {
		margin: 0 0 0.5rem;
	}

	.receipts h3 em {
		font-style: italic;
		opacity: 0.7;
		text-transform: none;
		letter-spacing: 0;
	}

	.gps h3 {
		margin: 0 0 0.5rem;
	}

	.gps dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem 1rem;
		margin: 0;
		padding: 0.7rem 0.9rem;
		background: var(--color-surface-2);
		border-radius: 4px;
	}

	.gps div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.gps dt {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.gps dd {
		font-family: var(--font-display);
		font-size: 1.05rem;
		margin: 0;
	}

	.gps .sub {
		font-size: 0.8rem;
		color: var(--color-muted);
	}

	.stop-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.1rem 0;
		margin-top: 0.25rem;
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.35rem 0.7rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.nav-btn:hover:not(:disabled) {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
	.nav-btn:disabled {
		opacity: 0.25;
		cursor: default;
	}
	.nav-arrow {
		font-size: 1rem;
		line-height: 1;
	}

	.nav-counter {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		color: var(--color-muted);
	}

	.coords {
		text-align: center;
		opacity: 0.6;
	}

	.social {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.social h3 {
		margin: 0 0 0.25rem;
	}
</style>
