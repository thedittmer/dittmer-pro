<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import { theme } from '$lib/theme';
	import { currentUser } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
	import StopForm from '$lib/trips/StopForm.svelte';
	import StopDetail from '$lib/trips/StopDetail.svelte';
	import TripDetail from '$lib/trips/TripDetail.svelte';
	import SearchPanel from '$lib/trips/SearchPanel.svelte';
	import type { Stop } from '$lib/trips/types';
	import type { StopType } from '$lib/trips/types';

	let { data } = $props();

	let stopFormOpen = $state(false);
	let editingStop = $state<Stop | null>(null);
	let selectedIndex = $state<number | null>(null);
	let tripDetailOpen = $state(false);
	let searchOpen = $state(false);
	let searchQuery = $state('');
	let activeTypes = $state(new Set<StopType>());
	let showFavorites = $state(false);
	let lastKnownLocation = $state<{ lat: number; lng: number } | null>(null);
	let stopMarkers: any[] = [];
	let mapLoaded = $state(false);

	function openAddStop() {
		editingStop = null;
		stopFormOpen = true;
	}

	function closeStopForm() {
		stopFormOpen = false;
		editingStop = null;
	}

	function startEdit(stop: Stop) {
		selectedIndex = null; // close the detail sheet first
		editingStop = stop;
		stopFormOpen = true;
	}

	async function handleStopSaved(stop: Stop) {
		// Refresh map data; the $effect below re-renders all stop pins.
		await invalidateAll();
		if (map && typeof stop.lat === 'number' && typeof stop.lng === 'number') {
			map.easeTo({ center: [stop.lng, stop.lat], zoom: 13, duration: 800 });
		}
	}

	async function handleStopDeleted(_id: string) {
		await invalidateAll();
	}

	function getBookmarks(): Set<string> {
		try {
			return new Set(JSON.parse(localStorage.getItem('bookmarked-stops') || '[]'));
		} catch { return new Set(); }
	}

	function toggleType(t: StopType) {
		const next = new Set(activeTypes);
		if (next.has(t)) next.delete(t);
		else next.add(t);
		activeTypes = next;
	}

	const hasFilters = $derived(searchQuery.length > 0 || activeTypes.size > 0 || showFavorites);

	function matchesFilters(s: Stop, q: string, bookmarks: Set<string> | null): boolean {
		if (activeTypes.size > 0 && !activeTypes.has(s.type)) return false;
		if (bookmarks && !bookmarks.has(s.id)) return false;
		if (q) {
			const haystack = [s.name, s.address, s.notes, s.type].filter(Boolean).join(' ').toLowerCase();
			if (!haystack.includes(q)) return false;
		}
		return true;
	}

	// Reactive marker rendering: re-runs whenever data.stops, filters, or mapLoaded changes.
	$effect(() => {
		const list = data.stops;
		const q = searchQuery.toLowerCase().trim();
		const _types = activeTypes; // touch for reactivity
		const _favs = showFavorites;
		if (!mapLoaded || !map || !mapboxgl) return;
		for (const m of stopMarkers) m.remove();
		stopMarkers = [];
		const bookmarks = getBookmarks();
		const favFilter = _favs ? bookmarks : null;
		for (let i = 0; i < list.length; i++) {
			const s = list[i];
			if (hasFilters && !matchesFilters(s, q, favFilter)) continue;
			const el = document.createElement('div');
			el.className = `stop-marker stop-${s.type}${bookmarks.has(s.id) ? ' bookmarked' : ''}`;
			el.textContent = String(i + 1);
			el.title = `${s.type}${s.name ? ' · ' + s.name : ''}`;
			const origIndex = i;
			el.addEventListener('click', (e) => {
				e.stopPropagation();
				selectedIndex = origIndex;
			});
			const marker = new mapboxgl.Marker({ element: el })
				.setLngLat([s.lng, s.lat])
				.addTo(map);
			stopMarkers.push(marker);
		}
	});

	// Pan map to the selected stop when navigating.
	$effect(() => {
		if (selectedIndex === null || !map || !mapLoaded) return;
		const s = data.stops[selectedIndex];
		if (s) map.easeTo({ center: [s.lng, s.lat], duration: 600 });
	});

	// Centered on Neosho, MO as final fallback.
	const NEOSHO = { lng: -94.3677, lat: 36.8689 };

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: any = null;
	let mapboxgl: any = null;

	type LocationStatus = 'pending' | 'granted' | 'denied' | 'last-stop' | 'idle';
	let locationStatus = $state<LocationStatus>('pending');

	const styleFor = (t: string) =>
		t === 'satellite'
			? 'mapbox://styles/mapbox/satellite-streets-v12'
			: t === 'dark'
				? 'mapbox://styles/mapbox/dark-v11'
				: 'mapbox://styles/mapbox/light-v11';

	// Swap basemap when theme changes.
	$effect(() => {
		const t = $theme;
		if (map) map.setStyle(styleFor(t));
	});

	// Compute miles driven for the latest gas stop by comparing to the previous one.
	const lastStopGasStats = $derived.by(() => {
		const ls = data.lastStop;
		if (!ls || ls.type !== 'gas' || !ls.odometer) return null;
		// Find previous gas stop with odometer
		const gasStops = data.stops.filter(
			(s) => s.type === 'gas' && s.odometer && s.odometer > 0 && s.id !== ls.id
		);
		if (gasStops.length === 0) return null;
		const prev = gasStops[gasStops.length - 1];
		const miles = ls.odometer - prev.odometer;
		if (miles <= 0) return null;
		const mpg = ls.gallons ? miles / ls.gallons : null;
		return { miles, mpg };
	});

	const TYPE_LABEL: Record<string, string> = {
		gas: 'fuel stop',
		sightseeing: 'sightseeing',
		hotel: 'hotel',
		food: 'food',
		rest: 'rest stop',
		other: 'stop'
	};

	function timeAgo(iso: string) {
		const t = new Date(iso.replace(' ', 'T')).getTime();
		if (isNaN(t)) return '';
		const min = Math.floor((Date.now() - t) / 60_000);
		if (min < 1) return 'just now';
		if (min < 60) return `${min} min ago`;
		const hr = Math.floor(min / 60);
		if (hr < 24) return `${hr} hr ago`;
		const day = Math.floor(hr / 24);
		return `${day} day${day === 1 ? '' : 's'} ago`;
	}

	onMount(() => {
		let cancelled = false;

		(async () => {
			const mod = await import('mapbox-gl');
			await import('mapbox-gl/dist/mapbox-gl.css');
			if (cancelled || !mapContainer) return;
			mapboxgl = mod.default;
			mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

			// Pick the initial center: last-stop > Neosho fallback.
			const initialCenter = data.lastStop
				? { lng: data.lastStop.lng, lat: data.lastStop.lat }
				: NEOSHO;
			const initialZoom = data.lastStop ? 11 : 12;

			map = new mapboxgl.Map({
				container: mapContainer,
				style: styleFor($theme),
				center: [initialCenter.lng, initialCenter.lat],
				zoom: initialZoom,
				attributionControl: false
			});

			map.on('load', () => {
				if (cancelled) return;
				mapLoaded = true;

				// Open a specific stop if the URL hash is #stop-{id}.
				const hash = window.location.hash;
				if (hash.startsWith('#stop-')) {
					const stopId = hash.slice(6);
					const idx = data.stops.findIndex((s) => s.id === stopId);
					if (idx >= 0) selectedIndex = idx;
				}

				// Public viewer with stops: fit the camera to all of them so the
				// whole trip is visible at a glance instead of only the latest pin.
				if (!data.isAdmin && data.stops.length > 0) {
					const bounds = new mapboxgl.LngLatBounds();
					for (const s of data.stops) bounds.extend([s.lng, s.lat]);
					map.fitBounds(bounds, {
						padding: { top: 96, bottom: 80, left: 60, right: 60 },
						duration: 0,
						maxZoom: 11
					});
				}
			});

			if (data.isAdmin) {
				// Admin: live geolocation pulse, in addition to the stop pins
				// rendered by the $effect on data.stops.
				if (!navigator.geolocation) {
					locationStatus = data.lastStop ? 'last-stop' : 'denied';
				} else {
					navigator.geolocation.getCurrentPosition(
						(pos) => {
							if (cancelled || !map) return;
							const here = { lng: pos.coords.longitude, lat: pos.coords.latitude };
							lastKnownLocation = here;
							locationStatus = 'granted';
							const el = document.createElement('div');
							el.className = 'user-marker';
							new mapboxgl.Marker({ element: el })
								.setLngLat([here.lng, here.lat])
								.addTo(map);
							map.easeTo({ center: [here.lng, here.lat], zoom: 13, duration: 1200 });
						},
						() => {
							locationStatus = data.lastStop ? 'last-stop' : 'denied';
						},
						{ timeout: 8000 }
					);
				}
			} else if (data.lastStop) {
				locationStatus = 'last-stop';
			} else {
				locationStatus = 'idle';
			}
		})();

		return () => {
			cancelled = true;
			map?.remove();
		};
	});
</script>

<svelte:head>
	<title>Map — Jason Dittmer</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	{@html '<style>html,body{overflow:hidden;height:100dvh}</style>'}
</svelte:head>

<main class="map">
	<div bind:this={mapContainer} class="canvas"></div>

	<div class="top-bar" onwheel={(e) => e.preventDefault()}>
		<button type="button" class="chip back" onclick={() => (searchOpen = !searchOpen)} aria-label="Search stops">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
		</button>

		{#if data.currentTrip}
			<button type="button" class="chip trip" onclick={() => (tripDetailOpen = true)}>
				<span class="trip-name">{data.currentTrip.name}</span>
			</button>
		{/if}

		<button
			type="button"
			class="chip status"
			onclick={() => { if (data.stops.length > 0) selectedIndex = data.stops.length - 1; }}
		>
			{#if locationStatus === 'pending'}
				<span class="dot pulse"></span>
				<span>Locating…</span>
			{:else if locationStatus === 'granted'}
				<span class="dot ok"></span>
				<span>You are here</span>
			{:else if locationStatus === 'last-stop' && data.lastStop}
				<span class="dot ok"></span>
				<span class="status-lines">
					<span class="status-top">
						{TYPE_LABEL[data.lastStop.type] ?? data.lastStop.type}
						{#if data.lastStop.name}· {data.lastStop.name}{/if}
						· {timeAgo(data.lastStop.timestamp)}
					</span>
					{#if data.lastStop.type === 'gas'}
						<span class="status-gas">
							{#if data.lastStop.price_per_gallon}${data.lastStop.price_per_gallon.toFixed(3)}/gal{/if}
							{#if data.lastStop.gallons}· {data.lastStop.gallons.toFixed(1)} gal{/if}
							{#if data.lastStop.total_cost}· ${data.lastStop.total_cost.toFixed(2)}{/if}
							{#if lastStopGasStats}· {lastStopGasStats.miles.toLocaleString()} mi{/if}
							{#if lastStopGasStats?.mpg}· {lastStopGasStats.mpg.toFixed(1)} mpg{/if}
						</span>
					{/if}
				</span>
			{:else if locationStatus === 'denied'}
				<span class="dot warn"></span>
				<span>Neosho, MO</span>
			{:else}
				<span class="dot warn"></span>
				<span>Neosho, MO</span>
			{/if}
		</button>
	</div>

	{#if $currentUser?.admin && data.currentTrip}
		<button class="fab" onclick={openAddStop} aria-label="Add stop">+</button>
	{/if}
</main>

{#if data.currentTrip}
	<StopForm
		open={stopFormOpen}
		tripId={data.currentTrip.id}
		stop={editingStop}
		seedCoords={lastKnownLocation}
		onClose={closeStopForm}
		onSaved={handleStopSaved}
		onDeleted={handleStopDeleted}
	/>
{/if}

{#if selectedIndex !== null && data.stops[selectedIndex]}
	<StopDetail
		stops={data.stops}
		bind:index={selectedIndex}
		onClose={() => (selectedIndex = null)}
		onEdit={startEdit}
	/>
{/if}

{#if tripDetailOpen && data.currentTrip}
	<TripDetail
		trip={data.currentTrip}
		stops={data.stops}
		onClose={() => (tripDetailOpen = false)}
	/>
{/if}

<SearchPanel
	stops={data.stops}
	open={searchOpen}
	query={searchQuery}
	{activeTypes}
	{showFavorites}
	onClose={() => (searchOpen = false)}
	onSelect={(i) => { selectedIndex = i; searchOpen = false; }}
	onQueryChange={(q) => (searchQuery = q)}
	onToggleType={toggleType}
	onToggleFavorites={() => (showFavorites = !showFavorites)}
/>

<style>
	.map {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		overflow: hidden;
		background: #000;
		z-index: 30;
	}

	.canvas {
		width: 100%;
		height: 100%;
	}

	.top-bar {
		position: absolute;
		inset: 0 0 auto 0;
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-areas: 'back trip space';
		align-items: start;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		padding-top: max(0.75rem, env(safe-area-inset-top));
		padding-right: max(4rem, env(safe-area-inset-right));
		pointer-events: none;
		z-index: 40;
	}

	.chip.back {
		grid-area: back;
	}

	.chip.trip {
		grid-area: trip;
		justify-self: center;
		max-width: min(70vw, 32rem);
	}

	.chip.status {
		grid-column: 1 / -1;
		justify-self: start;
		margin-top: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		background: rgba(10, 10, 10, 0.85);
		color: #f4ecd8;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		border: 1px solid rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		text-decoration: none;
		pointer-events: auto;
		max-width: calc(100vw - 6rem);
	}

	.chip.status {
		min-width: 0;
		cursor: pointer;
	}
	.chip.status:hover {
		border-color: rgba(255, 176, 112, 0.6);
		color: #ffb070;
	}

	.status-lines {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		overflow: hidden;
	}
	.status-top {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.status-gas {
		opacity: 0.7;
		font-size: 0.65rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip.status span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip.back {
		font-family: inherit;
		font-size: 1rem;
		letter-spacing: 0;
		padding: 0.45rem 0.8rem;
	}

	.chip.back:hover {
		color: #ffb070;
	}

	.chip.trip {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 0.95rem;
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		cursor: pointer;
	}

	.chip.trip:hover {
		border-color: rgba(255, 176, 112, 0.6);
		color: #ffb070;
	}

	.trip-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: rgba(244, 236, 216, 0.5);
		flex-shrink: 0;
	}
	.dot.ok {
		background: #ffb070;
		box-shadow: 0 0 0 3px rgba(255, 200, 140, 0.25);
	}
	.dot.warn {
		background: #c0a64f;
	}
	.dot.pulse {
		background: #ffb070;
		animation: pulse 1.6s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(255, 176, 112, 0.5);
		}
		50% {
			box-shadow: 0 0 0 8px rgba(255, 176, 112, 0);
		}
	}

	/* Admin's live "you are here" pulse */
	:global(.user-marker) {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #ffb070;
		border: 2px solid #fff;
		box-shadow: 0 0 0 0 rgba(255, 176, 112, 0.5);
		animation: ping 2s ease-out infinite;
	}

	/* Stop pins — solid amber/colored by type, no animation */
	:global(.stop-marker) {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #ffb070;
		border: 2px solid #fff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.55);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 700;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
		line-height: 1;
		font-family: var(--font-mono, monospace);
	}
	:global(.stop-gas) {
		background: #ffb070;
	}
	:global(.stop-sightseeing) {
		background: #6bc28b;
	}
	:global(.stop-hotel) {
		background: #6ba8e0;
	}
	:global(.stop-food) {
		background: #e07b6b;
	}
	:global(.stop-rest) {
		background: #b5a98f;
	}
	:global(.stop-other) {
		background: #c9a3e0;
	}
	:global(.stop-marker.bookmarked) {
		box-shadow: 0 0 0 3px rgba(255, 176, 112, 0.6), 0 4px 12px rgba(0, 0, 0, 0.55);
	}

	@keyframes ping {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 176, 112, 0.6);
		}
		100% {
			box-shadow: 0 0 0 24px rgba(255, 176, 112, 0);
		}
	}

	:global(.mapboxgl-ctrl-bottom-right),
	:global(.mapboxgl-ctrl-bottom-left) {
		display: none;
	}

	.fab {
		position: absolute;
		right: 1rem;
		bottom: max(1.25rem, env(safe-area-inset-bottom));
		z-index: 40;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: #ffb070;
		color: #000;
		border: 0;
		font-size: 1.8rem;
		line-height: 1;
		cursor: pointer;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.fab:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
	}
	.fab:active {
		transform: translateY(0);
	}
</style>
