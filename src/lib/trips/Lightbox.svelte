<script lang="ts">
	import { fade } from 'svelte/transition';

	type Props = {
		urls: string[];
		index: number;
		onClose: () => void;
	};

	let { urls, index = $bindable(), onClose }: Props = $props();

	let loaded = $state(false);
	let errored = $state(false);

	// Reset load state whenever the displayed image changes (open/prev/next).
	$effect(() => {
		// touch deps so this re-runs on index / url change
		void index;
		void urls[index];
		loaded = false;
		errored = false;
	});

	function prev(e?: Event) {
		e?.stopPropagation();
		index = (index - 1 + urls.length) % urls.length;
	}

	function next(e?: Event) {
		e?.stopPropagation();
		index = (index + 1) % urls.length;
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		else if (e.key === 'ArrowLeft') prev();
		else if (e.key === 'ArrowRight') next();
	}

	let touchStartX = 0;
	function onTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
	}
	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].screenX - touchStartX;
		if (Math.abs(dx) < 50) return;
		if (dx < 0) next();
		else prev();
	}
</script>

<svelte:window onkeydown={handleKey} />

<div
	class="overlay"
	transition:fade={{ duration: 150 }}
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="presentation"
>
	<button type="button" class="close" onclick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">×</button>

	{#if urls.length > 1}
		<button type="button" class="nav prev" onclick={prev} aria-label="Previous">‹</button>
		<button type="button" class="nav next" onclick={next} aria-label="Next">›</button>
		<div class="counter">{index + 1} / {urls.length}</div>
	{/if}

	<div class="image-wrap" onclick={(e) => e.stopPropagation()} role="presentation">
		{#if !loaded && !errored}
			<div class="spinner" aria-label="Loading"></div>
		{/if}
		{#if errored}
			<p class="errmsg">Couldn't load image.</p>
		{/if}
		<img
			src={urls[index]}
			alt=""
			class:loaded
			onload={() => {
				loaded = true;
				errored = false;
			}}
			onerror={() => {
				errored = true;
			}}
		/>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgba(0, 0, 0, 0.92);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.image-wrap {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100vw;
		max-height: 100dvh;
		min-width: 4rem;
		min-height: 4rem;
	}

	img {
		max-width: 100vw;
		max-height: 100dvh;
		object-fit: contain;
		display: block;
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	img.loaded {
		opacity: 1;
	}

	.spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 3px solid rgba(255, 255, 255, 0.18);
		border-top-color: #ffb070;
		animation: spin 0.85s linear infinite;
	}

	.errmsg {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #fff;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		opacity: 0.75;
		text-align: center;
		white-space: nowrap;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.close,
	.nav {
		position: absolute;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		padding: 0;
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		font-family: inherit;
	}
	.close:hover,
	.nav:hover {
		background: rgba(0, 0, 0, 0.8);
	}

	.close {
		top: max(1rem, env(safe-area-inset-top));
		right: max(1rem, env(safe-area-inset-right));
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.6rem;
	}

	.nav {
		top: 50%;
		transform: translateY(-50%);
		width: 3rem;
		height: 3rem;
		font-size: 2rem;
	}
	.prev {
		left: 0.75rem;
	}
	.next {
		right: 0.75rem;
	}

	.counter {
		position: absolute;
		bottom: max(1rem, env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		color: #fff;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		padding: 0.4rem 0.85rem;
		background: rgba(0, 0, 0, 0.55);
		border-radius: 999px;
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}
</style>
