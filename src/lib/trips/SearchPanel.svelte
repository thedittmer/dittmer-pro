<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { STOP_TYPES, type StopType, type Stop } from './types';

	type Props = {
		stops: Stop[];
		open: boolean;
		query: string;
		activeTypes: Set<StopType>;
		showFavorites: boolean;
		onClose: () => void;
		onSelect: (originalIndex: number) => void;
		onQueryChange: (q: string) => void;
		onToggleType: (t: StopType) => void;
		onToggleFavorites: () => void;
	};

	let {
		stops, open, query, activeTypes, showFavorites,
		onClose, onSelect, onQueryChange, onToggleType, onToggleFavorites
	}: Props = $props();

	let inputEl: HTMLInputElement | undefined = $state();

	function getBookmarks(): Set<string> {
		try {
			return new Set(JSON.parse(localStorage.getItem('bookmarked-stops') || '[]'));
		} catch { return new Set(); }
	}

	const TYPE_LABEL: Record<string, string> = {
		gas: 'gas',
		sightseeing: 'sights',
		hotel: 'hotel',
		food: 'food',
		rest: 'rest',
		other: 'other'
	};

	const filtered = $derived.by(() => {
		const q = query.toLowerCase().trim();
		const bookmarks = showFavorites ? getBookmarks() : null;
		const results: { stop: Stop; originalIndex: number }[] = [];

		for (let i = 0; i < stops.length; i++) {
			const s = stops[i];
			if (activeTypes.size > 0 && !activeTypes.has(s.type)) continue;
			if (bookmarks && !bookmarks.has(s.id)) continue;
			if (q) {
				const haystack = [s.name, s.address, s.notes, s.type].filter(Boolean).join(' ').toLowerCase();
				if (!haystack.includes(q)) continue;
			}
			results.push({ stop: s, originalIndex: i });
		}
		return results;
	});

	const hasActiveFilters = $derived(query.length > 0 || activeTypes.size > 0 || showFavorites);

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	$effect(() => {
		if (open) setTimeout(() => inputEl?.focus(), 100);
	});
</script>

<svelte:window onkeydown={open ? handleKey : undefined} />

{#if open}
	<div
		class="backdrop"
		transition:fade={{ duration: 150 }}
		onclick={onClose}
		role="presentation"
	></div>

	<div
		class="panel"
		transition:fly={{ x: -300, duration: 250 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="Search stops"
	>
		<div class="panel-head">
			<input
				bind:this={inputEl}
				type="text"
				value={query}
				oninput={(e) => onQueryChange(e.currentTarget.value)}
				placeholder="Search stops..."
				class="search-input"
			/>
			<button type="button" class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</div>

		<div class="filters">
			<div class="type-row">
				{#each STOP_TYPES as t}
					<button
						type="button"
						class="type-pill"
						class:active={activeTypes.has(t)}
						onclick={() => onToggleType(t)}
					>{TYPE_LABEL[t]}</button>
				{/each}
			</div>

			<button
				type="button"
				class="fav-btn"
				class:active={showFavorites}
				onclick={onToggleFavorites}
			>
				{showFavorites ? '★' : '☆'} favorites
			</button>
		</div>

		<div class="results">
			{#if filtered.length === 0 && hasActiveFilters}
				<p class="empty">No stops match</p>
			{:else}
				{#each filtered as { stop, originalIndex } (stop.id)}
					<button
						type="button"
						class="result"
						onclick={() => onSelect(originalIndex)}
					>
						<span class="result-name">{stop.name || 'Untitled stop'}</span>
						<span class="result-meta">
							<span class="result-type type-{stop.type}">{TYPE_LABEL[stop.type]}</span>
							{#if stop.address}<span class="result-addr">{stop.address}</span>{/if}
						</span>
					</button>
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 45;
		background: rgba(0, 0, 0, 0.4);
	}

	.panel {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: min(22rem, 85vw);
		z-index: 46;
		background: rgba(10, 10, 10, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		padding: max(0.75rem, env(safe-area-inset-top)) 1rem 1rem;
		overflow: hidden;
	}

	.panel-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.search-input {
		flex: 1;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.08);
		color: #f4ecd8;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 16px;
		letter-spacing: 0.06em;
		outline: none;
	}
	.search-input::placeholder {
		color: rgba(244, 236, 216, 0.4);
	}
	.search-input:focus {
		border-color: rgba(255, 176, 112, 0.5);
	}

	.close-btn {
		background: transparent;
		border: 0;
		color: rgba(244, 236, 216, 0.6);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem 0.4rem;
		line-height: 1;
	}
	.close-btn:hover {
		color: #ffb070;
	}

	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.type-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.type-pill {
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(244, 236, 216, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.type-pill:hover {
		border-color: rgba(255, 176, 112, 0.4);
		color: #f4ecd8;
	}
	.type-pill.active {
		background: rgba(255, 176, 112, 0.2);
		border-color: rgba(255, 176, 112, 0.6);
		color: #ffb070;
	}

	.fav-btn {
		align-self: flex-start;
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(244, 236, 216, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.fav-btn:hover {
		border-color: rgba(255, 176, 112, 0.4);
		color: #f4ecd8;
	}
	.fav-btn.active {
		background: rgba(255, 176, 112, 0.2);
		border-color: rgba(255, 176, 112, 0.6);
		color: #ffb070;
	}

	.results {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.empty {
		color: rgba(244, 236, 216, 0.4);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		padding: 1rem 0;
		text-align: center;
		margin: 0;
	}

	.result {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0.5rem;
		border: 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		background: transparent;
		color: #f4ecd8;
		text-align: left;
		cursor: pointer;
	}
	.result:hover {
		background: rgba(255, 176, 112, 0.08);
	}

	.result-name {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 0.95rem;
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(244, 236, 216, 0.5);
	}

	.result-type {
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		font-size: 0.55rem;
	}
	.type-gas { background: rgba(255, 176, 112, 0.15); color: #ffb070; }
	.type-sightseeing { background: rgba(107, 194, 139, 0.15); color: #6bc28b; }
	.type-hotel { background: rgba(107, 168, 224, 0.15); color: #6ba8e0; }
	.type-food { background: rgba(224, 123, 107, 0.15); color: #e07b6b; }
	.type-rest { background: rgba(181, 169, 143, 0.15); color: #b5a98f; }
	.type-other { background: rgba(201, 163, 224, 0.15); color: #c9a3e0; }

	.result-addr {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
