<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { SceneHandle } from './scene';

	let { autoplay = true }: { autoplay?: boolean } = $props();

	let canvas = $state<HTMLCanvasElement | undefined>();
	let wrap = $state<HTMLDivElement | undefined>();
	let scene: SceneHandle | null = null;
	let progress = $state(0);
	let duration = $state(15);
	let playing = $state(false);
	let started = $state(untrack(() => autoplay));
	let devMode = $state(false);
	let ready = $state(false);
	let pendingStart = $state(false);

	function fit() {
		if (!scene || !wrap) return;
		const r = wrap.getBoundingClientRect();
		scene.resize(r.width, r.height);
	}

	function start() {
		if (!scene) {
			// Three.js still loading — remember the user wanted to start, kick it off when ready.
			pendingStart = true;
			started = true;
			return;
		}
		started = true;
		scene.reset();
		scene.play();
		playing = true;
	}

	function replay() {
		if (!scene) return;
		scene.reset();
		scene.play();
		playing = true;
	}

	function togglePlay() {
		if (!scene) return;
		if (playing) {
			scene.pause();
			playing = false;
		} else {
			if (progress >= duration) scene.reset();
			scene.play();
			playing = true;
		}
	}

	function onScrub(e: Event) {
		const v = parseFloat((e.target as HTMLInputElement).value);
		scene?.pause();
		playing = false;
		scene?.setTime(v);
	}

	function onKey(e: KeyboardEvent) {
		const inField =
			document.activeElement &&
			['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
		if (inField) return;
		if (e.key === 'd' || e.key === 'D') devMode = !devMode;
		if (e.key === ' ') {
			e.preventDefault();
			togglePlay();
		}
		if (e.key === 'r' || e.key === 'R') replay();
	}

	onMount(() => {
		let cancelled = false;
		let ro: ResizeObserver | null = null;

		(async () => {
			const { createScene } = await import('./scene');
			if (cancelled || !canvas) return;
			scene = await createScene(canvas);
			duration = scene.getDuration();
			scene.onProgress((t) => {
				progress = t;
				if (t >= duration) playing = false;
			});
			ready = true;
			fit();
			if (autoplay || pendingStart) {
				pendingStart = false;
				scene.reset();
				scene.play();
				playing = true;
			}
			if (wrap) {
				ro = new ResizeObserver(fit);
				ro.observe(wrap);
			}
		})();

		window.addEventListener('keydown', onKey);

		return () => {
			cancelled = true;
			ro?.disconnect();
			window.removeEventListener('keydown', onKey);
			scene?.dispose();
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="stage" bind:this={wrap}>
	<canvas bind:this={canvas}></canvas>

	{#if !started || pendingStart}
		<button
			class="play-overlay"
			onclick={start}
			aria-label="Begin"
			disabled={pendingStart}
		>
			<span class="dot" class:loading={pendingStart}></span>
			<span class="label">First Light</span>
			<span class="hint">{pendingStart ? 'loading…' : 'press to begin · 15 seconds'}</span>
		</button>
	{/if}

	{#if started && !playing && progress >= duration - 0.001}
		<button class="replay" onclick={replay} aria-label="Replay">
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
				<path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor" />
			</svg>
			<span>replay</span>
		</button>
	{/if}

	{#if devMode}
		<div class="dev">
			<button class="ico" onclick={togglePlay}>{playing ? '❚❚' : '►'}</button>
			<input type="range" min="0" max={duration} step="0.01" value={progress} oninput={onScrub} />
			<span class="time">{progress.toFixed(2)} / {duration.toFixed(2)}</span>
		</div>
	{/if}

	<div class="hud" class:visible={started}>
		<span>space · play/pause</span>
		<span>r · replay</span>
		<span>d · scrub</span>
	</div>
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		min-height: 60vh;
		max-height: 100vh;
		overflow: hidden;
		background: #000;
		border-radius: 4px;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		/* Animation has no direct user interaction — keep taps reaching the overlay button */
		pointer-events: none;
	}

	.play-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.2rem;
		background: radial-gradient(circle at center, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.85));
		color: #f4ecd8;
		border: 0;
		cursor: pointer;
		font-family: 'Cormorant Garamond', serif;
		letter-spacing: 0.05em;
		transition: opacity 0.4s ease;
		/* iOS: avoid 300ms tap delay and the gray flash; keep the surface tappable */
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		-webkit-appearance: none;
		appearance: none;
		user-select: none;
	}
	.play-overlay:disabled {
		cursor: default;
	}
	.play-overlay:hover .dot {
		transform: scale(1.15);
		box-shadow: 0 0 60px 10px rgba(255, 200, 140, 0.6);
	}
	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fff3d6;
		box-shadow: 0 0 30px 6px rgba(255, 200, 140, 0.45);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}
	.dot.loading {
		animation: pulse 1.4s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 0 30px 6px rgba(255, 200, 140, 0.45);
		}
		50% {
			transform: scale(1.25);
			box-shadow: 0 0 60px 12px rgba(255, 200, 140, 0.7);
		}
	}
	.label {
		font-size: 2.4rem;
		font-style: italic;
		font-weight: 300;
	}
	.hint {
		font-size: 0.9rem;
		opacity: 0.6;
		text-transform: lowercase;
	}

	.replay {
		position: absolute;
		bottom: 2.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 1rem;
		border: 1px solid rgba(244, 236, 216, 0.35);
		background: rgba(0, 0, 0, 0.35);
		color: #f4ecd8;
		border-radius: 999px;
		cursor: pointer;
		font-family: 'Cormorant Garamond', serif;
		font-size: 0.95rem;
		font-style: italic;
		letter-spacing: 0.04em;
		backdrop-filter: blur(6px);
		animation: fadeIn 0.6s ease;
	}
	.replay:hover {
		border-color: rgba(244, 236, 216, 0.7);
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, 8px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.hud {
		position: absolute;
		bottom: 0.75rem;
		right: 1rem;
		display: flex;
		gap: 0.9rem;
		font-size: 0.7rem;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		color: rgba(244, 236, 216, 0.4);
		opacity: 0;
		transition: opacity 0.6s ease 0.6s;
		pointer-events: none;
	}
	.hud.visible {
		opacity: 1;
	}

	.dev {
		position: absolute;
		left: 1rem;
		right: 1rem;
		bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(244, 236, 216, 0.2);
		border-radius: 8px;
		color: #f4ecd8;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.8rem;
	}
	.dev input[type='range'] {
		flex: 1;
		accent-color: #ffb070;
	}
	.dev .ico {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(244, 236, 216, 0.35);
		border-radius: 4px;
		padding: 0.15rem 0.5rem;
		cursor: pointer;
		font-family: inherit;
	}
	.dev .time {
		opacity: 0.7;
		min-width: 7ch;
	}
</style>
