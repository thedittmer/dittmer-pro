<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
	import type { Trip, Stop } from './types';

	type Props = {
		trip: Trip;
		stops: Stop[];
		onClose: () => void;
	};

	let { trip, stops, onClose }: Props = $props();

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function parseDate(s: string | undefined): Date | null {
		if (!s) return null;
		const d = new Date(s.replace(' ', 'T'));
		return isNaN(d.getTime()) ? null : d;
	}

	function fmtDate(d: Date | null) {
		if (!d) return null;
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	// -- timeline ---------------------------------------------------------
	const start = $derived(parseDate(trip.start_date));
	const end = $derived(parseDate(trip.end_date));

	const dayStatus = $derived.by(() => {
		const now = new Date();
		const ms = 86_400_000;
		if (!start) return null;
		if (now < start) {
			const days = Math.max(1, Math.ceil((start.getTime() - now.getTime()) / ms));
			return { kind: 'upcoming' as const, label: `starts in ${days} day${days === 1 ? '' : 's'}` };
		}
		if (end && now > new Date(end.getTime() + ms)) {
			return { kind: 'ended' as const, label: `ended ${fmtDate(end)}` };
		}
		const dayN = Math.floor((now.getTime() - start.getTime()) / ms) + 1;
		if (end) {
			const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / ms) + 1);
			return { kind: 'active' as const, label: `day ${dayN} of ${totalDays}` };
		}
		return { kind: 'active' as const, label: `day ${dayN}` };
	});

	// -- gas + mileage ----------------------------------------------------
	const gasStops = $derived(stops.filter((s) => s.type === 'gas'));
	const gasWithOdo = $derived(
		gasStops
			.filter((s) => typeof s.odometer === 'number' && s.odometer > 0)
			.sort((a, b) => a.odometer - b.odometer)
	);

	const totalGallons = $derived(gasStops.reduce((sum, s) => sum + (s.gallons || 0), 0));
	const totalCost = $derived(gasStops.reduce((sum, s) => sum + (s.total_cost || 0), 0));
	const avgPrice = $derived(totalGallons > 0 ? totalCost / totalGallons : null);

	const distance = $derived(
		gasWithOdo.length >= 2
			? gasWithOdo[gasWithOdo.length - 1].odometer - gasWithOdo[0].odometer
			: null
	);

	// MPG = miles traveled between first and last fillup, divided by gallons
	// burned to cover them (i.e., every fillup *after* the first).
	const mpg = $derived.by(() => {
		if (!distance || gasWithOdo.length < 2) return null;
		const gallonsBurned = gasWithOdo.slice(1).reduce((sum, s) => sum + (s.gallons || 0), 0);
		return gallonsBurned > 0 ? distance / gallonsBurned : null;
	});

	const featuredUrl = $derived(
		trip.featured_image
			? `${PUBLIC_POCKETBASE_URL}/api/files/${trip.collectionId}/${trip.id}/${trip.featured_image}?thumb=1200x900`
			: null
	);
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
		transition:fly={{ y: 40, duration: 200 }}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="trip-detail-title"
		tabindex="-1"
	>
		{#if featuredUrl}
			<div class="hero" style:background-image="url({featuredUrl})"></div>
		{/if}

		<div class="head">
			<div class="drag-handle"></div>
			<div class="title-block">
				{#if dayStatus}
					<span class="text-meta day-{dayStatus.kind}">{dayStatus.label}</span>
				{/if}
				<h2 id="trip-detail-title">{trip.name}</h2>
				{#if trip.origin || trip.destination}
					<p class="route">
						{trip.origin || '—'}
						<span class="arrow">→</span>
						{trip.destination || '—'}
					</p>
				{/if}
				{#if start || end}
					<p class="dates">
						{fmtDate(start) ?? '?'}
						{#if end}— {fmtDate(end)}{/if}
					</p>
				{/if}
			</div>
			<button type="button" onclick={onClose} aria-label="Close" class="x">×</button>
		</div>

		{#if trip.description}
			<p class="description">{trip.description}</p>
		{/if}

		<dl class="stats">
			<div>
				<dt>Stops</dt>
				<dd>{stops.length}</dd>
			</div>
			{#if gasStops.length > 0}
				<div>
					<dt>Fuel stops</dt>
					<dd>{gasStops.length}</dd>
				</div>
			{/if}
			{#if distance !== null}
				<div>
					<dt>Distance</dt>
					<dd>{Math.round(distance).toLocaleString()} <span class="unit">mi</span></dd>
				</div>
			{/if}
			{#if mpg !== null}
				<div>
					<dt>MPG</dt>
					<dd>{mpg.toFixed(1)}</dd>
				</div>
			{/if}
			{#if totalGallons > 0}
				<div>
					<dt>Gallons</dt>
					<dd>{totalGallons.toFixed(1)}</dd>
				</div>
			{/if}
			{#if totalCost > 0}
				<div>
					<dt>Spent on gas</dt>
					<dd>${totalCost.toFixed(2)}</dd>
				</div>
			{/if}
			{#if avgPrice !== null}
				<div>
					<dt>Avg $/gal</dt>
					<dd>${avgPrice.toFixed(3)}</dd>
				</div>
			{/if}
		</dl>
	</div>
</div>

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
		padding: 0 1.25rem 1.5rem;
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

	.hero {
		margin: 0 -1.25rem;
		aspect-ratio: 16 / 9;
		background-size: cover;
		background-position: center;
		border-radius: 12px 12px 0 0;
	}

	@media (min-width: 720px) {
		.hero {
			border-radius: 8px 8px 0 0;
		}
	}

	.head {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding-top: 1rem;
	}

	.drag-handle {
		position: absolute;
		top: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 2.5rem;
		height: 0.25rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.4);
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
		gap: 0.35rem;
	}

	.title-block h2 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.7rem;
		line-height: 1.15;
		margin: 0;
	}

	.day-active {
		color: var(--color-accent);
	}

	.route {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		color: var(--color-muted);
		margin: 0.1rem 0 0;
	}
	.route .arrow {
		margin: 0 0.4rem;
		color: var(--color-faint);
	}

	.dates {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
		margin: 0;
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

	.description {
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--color-text);
		margin: 0;
		white-space: pre-wrap;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 0.75rem;
		padding: 0.9rem 1rem;
		background: var(--color-surface-2);
		border-radius: 4px;
		margin: 0;
	}

	.stats div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stats dt {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.stats dd {
		font-family: var(--font-display);
		font-size: 1.35rem;
		margin: 0;
	}

	.stats .unit {
		font-size: 0.85rem;
		color: var(--color-muted);
		font-style: italic;
	}
</style>
