<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import { ClientResponseError } from 'pocketbase';
	import { STOP_TYPES, type StopType, type Stop } from './types';

	type Props = {
		open: boolean;
		tripId: string;
		seedCoords?: { lat: number; lng: number } | null;
		onClose: () => void;
		onSaved: (stop: Stop) => void;
	};

	let { open, tripId, seedCoords = null, onClose, onSaved }: Props = $props();

	let type = $state<StopType>('gas');
	let name = $state('');
	let lat = $state<number | ''>('');
	let lng = $state<number | ''>('');
	// GPS metadata captured silently from the geolocation callback. Not editable.
	let accuracy = $state<number | null>(null);
	let altitude = $state<number | null>(null);
	let altitudeAccuracy = $state<number | null>(null);
	let heading = $state<number | null>(null);
	let speed = $state<number | null>(null);
	let address = $state('');
	let timestamp = $state(toLocalInput(new Date()));
	let notes = $state('');
	let odometer = $state<number | ''>('');
	let gallons = $state<number | ''>('');
	let pricePerGallon = $state<number | ''>('');

	// File pickers: track files + their object URLs in parallel so we can render
	// thumbnails and revoke URLs on remove/close. Plain FileList won't cut it
	// because we want to accumulate across multiple camera shots.
	let photos = $state<File[]>([]);
	let photoUrls = $state<string[]>([]);
	let receipts = $state<File[]>([]);
	let receiptUrls = $state<string[]>([]);

	let photoCameraInput: HTMLInputElement | undefined = $state();
	let photoLibraryInput: HTMLInputElement | undefined = $state();
	let receiptCameraInput: HTMLInputElement | undefined = $state();
	let receiptLibraryInput: HTMLInputElement | undefined = $state();

	let busy = $state(false);
	let errorMessage = $state('');
	let locating = $state(false);

	const total = $derived(
		typeof gallons === 'number' && typeof pricePerGallon === 'number'
			? Math.round(gallons * pricePerGallon * 100) / 100
			: null
	);

	// Re-seed and re-locate every time the modal opens.
	let lastOpen = false;
	$effect(() => {
		if (open && !lastOpen) {
			reset();
			if (seedCoords) {
				lat = seedCoords.lat;
				lng = seedCoords.lng;
			}
			refreshLocation();
		}
		lastOpen = open;
	});

	function reset() {
		type = 'gas';
		name = '';
		lat = '';
		lng = '';
		address = '';
		timestamp = toLocalInput(new Date());
		notes = '';
		odometer = '';
		gallons = '';
		pricePerGallon = '';
		accuracy = null;
		altitude = null;
		altitudeAccuracy = null;
		heading = null;
		speed = null;
		clearFiles(photos, photoUrls);
		clearFiles(receipts, receiptUrls);
		errorMessage = '';
		busy = false;
	}

	function addFiles(input: HTMLInputElement, files: File[], urls: string[]) {
		if (input.files) {
			for (const f of input.files) {
				files.push(f);
				urls.push(URL.createObjectURL(f));
			}
		}
		input.value = ''; // allow same file to be picked again
	}

	function removeFile(files: File[], urls: string[], i: number) {
		URL.revokeObjectURL(urls[i]);
		files.splice(i, 1);
		urls.splice(i, 1);
	}

	function clearFiles(files: File[], urls: string[]) {
		for (const u of urls) URL.revokeObjectURL(u);
		files.length = 0;
		urls.length = 0;
	}

	onDestroy(() => {
		clearFiles(photos, photoUrls);
		clearFiles(receipts, receiptUrls);
	});

	function toLocalInput(d: Date) {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function fromLocalInput(local: string): string {
		if (!local) return '';
		const d = new Date(local);
		return isNaN(d.getTime()) ? '' : d.toISOString();
	}

	function refreshLocation() {
		if (!navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const c = pos.coords;
				lat = Math.round(c.latitude * 1e6) / 1e6;
				lng = Math.round(c.longitude * 1e6) / 1e6;
				accuracy = typeof c.accuracy === 'number' ? c.accuracy : null;
				altitude = typeof c.altitude === 'number' ? c.altitude : null;
				altitudeAccuracy = typeof c.altitudeAccuracy === 'number' ? c.altitudeAccuracy : null;
				heading = typeof c.heading === 'number' && !isNaN(c.heading) ? c.heading : null;
				speed = typeof c.speed === 'number' && !isNaN(c.speed) ? c.speed : null;
				locating = false;
			},
			() => {
				locating = false;
			},
			{ timeout: 8000, enableHighAccuracy: true }
		);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		busy = true;

		try {
			const fd = new FormData();
			fd.set('trip', tripId);
			fd.set('type', type);
			fd.set('name', name);
			if (typeof lat === 'number') fd.set('lat', String(lat));
			if (typeof lng === 'number') fd.set('lng', String(lng));
			if (accuracy !== null) fd.set('accuracy', String(accuracy));
			if (altitude !== null) fd.set('altitude', String(altitude));
			if (altitudeAccuracy !== null) fd.set('altitude_accuracy', String(altitudeAccuracy));
			if (heading !== null) fd.set('heading', String(heading));
			if (speed !== null) fd.set('speed', String(speed));
			fd.set('address', address);
			fd.set('timestamp', fromLocalInput(timestamp));
			fd.set('notes', notes);

			if (type === 'gas') {
				if (typeof odometer === 'number') fd.set('odometer', String(odometer));
				if (typeof gallons === 'number') fd.set('gallons', String(gallons));
				if (typeof pricePerGallon === 'number') fd.set('price_per_gallon', String(pricePerGallon));
				if (total !== null) fd.set('total_cost', String(total));
			}

			for (const f of photos) fd.append('photos+', f);
			for (const f of receipts) fd.append('receipts+', f);

			const saved = await pb.collection('stops').create<Stop>(fd);
			onSaved(saved);
			onClose();
		} catch (err) {
			if (err instanceof ClientResponseError) {
				errorMessage = err.response?.message || err.message;
				const data = err.response?.data as Record<string, { message?: string }> | undefined;
				if (data) {
					const fieldErrs = Object.entries(data)
						.map(([k, v]) => `${k}: ${v.message ?? ''}`)
						.join('; ');
					if (fieldErrs) errorMessage += ` — ${fieldErrs}`;
				}
			} else {
				errorMessage = (err as Error).message;
			}
		} finally {
			busy = false;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
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
			aria-labelledby="stop-form-title"
			tabindex="-1"
		>
			<div class="head">
				<div class="drag-handle"></div>
				<h2 id="stop-form-title">Add stop</h2>
				<button type="button" onclick={onClose} aria-label="Close" class="x">×</button>
			</div>

			<form onsubmit={handleSubmit}>
				{#if errorMessage}
					<div class="error">{errorMessage}</div>
				{/if}

				<div class="row">
					<label class="grow">
						<span>Type</span>
						<select bind:value={type}>
							{#each STOP_TYPES as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</label>
					<label class="grow">
						<span>When</span>
						<input type="datetime-local" bind:value={timestamp} />
					</label>
				</div>

				<label>
					<span>Name</span>
					<input
						type="text"
						bind:value={name}
						placeholder={type === 'gas' ? 'Phillips 66 Tulsa' : 'Grand Canyon south rim'}
					/>
				</label>

				<div class="row coords">
					<label class="grow">
						<span>Latitude</span>
						<input type="number" step="any" bind:value={lat} />
					</label>
					<label class="grow">
						<span>Longitude</span>
						<input type="number" step="any" bind:value={lng} />
					</label>
					<button
						type="button"
						class="locate"
						onclick={refreshLocation}
						disabled={locating}
						aria-label="Use current location"
					>
						{locating ? '…' : '⌖'}
					</button>
				</div>

				{#if accuracy !== null || altitude !== null}
					<p class="gps-meta">
						{#if accuracy !== null}±{accuracy.toFixed(0)}m{/if}
						{#if altitude !== null}
							{#if accuracy !== null} · {/if}
							elev {Math.round(altitude * 3.28084).toLocaleString()}ft
						{/if}
					</p>
				{/if}

				<label>
					<span>Address <em>(optional)</em></span>
					<input type="text" bind:value={address} />
				</label>

				{#if type === 'gas'}
					<fieldset class="gas">
						<legend>Gas</legend>
						<div class="row">
							<label class="grow">
								<span>Odometer</span>
								<input type="number" step="1" bind:value={odometer} />
							</label>
							<label class="grow">
								<span>Gallons</span>
								<input type="number" step="0.01" bind:value={gallons} />
							</label>
							<label class="grow">
								<span>$/gallon</span>
								<input type="number" step="0.001" bind:value={pricePerGallon} />
							</label>
						</div>
						{#if total !== null}
							<p class="total">Total: <strong>${total.toFixed(2)}</strong></p>
						{/if}
					</fieldset>
				{/if}

				<div class="picker">
					<span class="picker-label">Photos <em>(public)</em></span>
					<div class="picker-buttons">
						<button type="button" class="pickbtn" onclick={() => photoCameraInput?.click()}>
							📷 Camera
						</button>
						<button type="button" class="pickbtn" onclick={() => photoLibraryInput?.click()}>
							📎 Library
						</button>
						{#if photos.length > 0}
							<span class="picker-count">{photos.length}</span>
						{/if}
					</div>
					<input
						bind:this={photoCameraInput}
						type="file"
						accept="image/*"
						capture="environment"
						multiple
						hidden
						onchange={(e) => addFiles(e.currentTarget, photos, photoUrls)}
					/>
					<input
						bind:this={photoLibraryInput}
						type="file"
						accept="image/*"
						multiple
						hidden
						onchange={(e) => addFiles(e.currentTarget, photos, photoUrls)}
					/>
					{#if photos.length > 0}
						<div class="thumbs">
							{#each photos as _photo, i (photoUrls[i])}
								<div class="thumb">
									<img src={photoUrls[i]} alt="" />
									<button
										type="button"
										class="thumb-x"
										onclick={() => removeFile(photos, photoUrls, i)}
										aria-label="Remove photo"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="picker">
					<span class="picker-label">Receipts & odometer <em>(private — admin only)</em></span>
					<div class="picker-buttons">
						<button type="button" class="pickbtn" onclick={() => receiptCameraInput?.click()}>
							📷 Camera
						</button>
						<button type="button" class="pickbtn" onclick={() => receiptLibraryInput?.click()}>
							📎 Library
						</button>
						{#if receipts.length > 0}
							<span class="picker-count">{receipts.length}</span>
						{/if}
					</div>
					<input
						bind:this={receiptCameraInput}
						type="file"
						accept="image/*"
						capture="environment"
						multiple
						hidden
						onchange={(e) => addFiles(e.currentTarget, receipts, receiptUrls)}
					/>
					<input
						bind:this={receiptLibraryInput}
						type="file"
						accept="image/*"
						multiple
						hidden
						onchange={(e) => addFiles(e.currentTarget, receipts, receiptUrls)}
					/>
					{#if receipts.length > 0}
						<div class="thumbs">
							{#each receipts as _r, i (receiptUrls[i])}
								<div class="thumb">
									<img src={receiptUrls[i]} alt="" />
									<button
										type="button"
										class="thumb-x"
										onclick={() => removeFile(receipts, receiptUrls, i)}
										aria-label="Remove receipt"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<label>
					<span>Notes <em>(optional)</em></span>
					<textarea rows="3" bind:value={notes}></textarea>
				</label>

				<div class="actions">
					<button type="button" class="ghost" onclick={onClose} disabled={busy}>cancel</button>
					<button type="submit" class="primary" disabled={busy}>
						{busy ? 'saving…' : 'save stop'}
					</button>
				</div>
			</form>
		</div>
	</div>
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
		padding: 1rem 1.25rem 1.25rem;
		padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
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
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
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

	.head h2 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.4rem;
		margin: 0.5rem 0 0;
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

	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label > span {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	label em {
		font-style: italic;
		opacity: 0.7;
		text-transform: none;
		letter-spacing: 0;
	}

	input[type='text'],
	input[type='number'],
	input[type='datetime-local'],
	select,
	textarea {
		width: 100%;
		padding: 0.65rem 0.8rem;
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		font: inherit;
		font-size: 16px; /* avoid iOS auto-zoom */
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.row {
		display: flex;
		gap: 0.75rem;
	}

	.grow {
		flex: 1;
		min-width: 0;
	}

	.coords {
		align-items: flex-end;
	}

	.locate {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-2);
		color: var(--color-accent);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		cursor: pointer;
		font-size: 1.1rem;
	}
	.locate:hover {
		border-color: var(--color-accent);
	}
	.locate:disabled {
		opacity: 0.5;
	}

	.gas {
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.gas legend {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
		padding: 0 0.4rem;
	}

	.total {
		font-family: var(--font-display);
		font-size: 1.05rem;
		color: var(--color-muted);
		margin: 0;
	}
	.total strong {
		color: var(--color-text);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}

	.primary {
		background: var(--color-accent);
		color: var(--color-on-accent);
		border: 0;
		padding: 0.7rem 1.2rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.primary:disabled {
		opacity: 0.5;
	}

	.ghost {
		background: transparent;
		color: var(--color-muted);
		border: 1px solid var(--color-border);
		padding: 0.7rem 1.2rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}

	.error {
		color: #ff6b6b;
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #ff6b6b;
		border-radius: 3px;
	}

	.gps-meta {
		margin: -0.5rem 0 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		color: var(--color-muted);
	}

	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.picker-label {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.picker-label em {
		font-style: italic;
		opacity: 0.7;
		text-transform: none;
		letter-spacing: 0;
	}

	.picker-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.pickbtn {
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.55rem 0.9rem;
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.pickbtn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.picker-count {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-muted);
	}

	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.thumb {
		position: relative;
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 3px;
		overflow: hidden;
		border: 1px solid var(--color-border);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb-x {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		border: 0;
		font-size: 0.85rem;
		line-height: 1;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.thumb-x:hover {
		background: rgba(0, 0, 0, 0.9);
	}
</style>
