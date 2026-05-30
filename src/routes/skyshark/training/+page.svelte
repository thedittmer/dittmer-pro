<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createAirspaceScene, airspaceFocus } from '$lib/skyshark/training/scenes/airspace';
	import { createWeatherScene, weatherFocus } from '$lib/skyshark/training/scenes/weather';
	import {
		createRegulationsScene,
		regulationsFocus
	} from '$lib/skyshark/training/scenes/regulations';
	import { createSectionalScene, sectionalFocus } from '$lib/skyshark/training/scenes/sectional';
	import { createLoadingScene, loadingFocus } from '$lib/skyshark/training/scenes/loading';
	import { createNarrator, type Narrator } from '$lib/skyshark/training/narrator';
	import { loadSections } from '$lib/skyshark/training/loader';
	import { studySections } from '$lib/skyshark/training/content';
	import type {
		FocusButton,
		NarrationLine,
		StudySection,
		TrainingScene
	} from '$lib/skyshark/training/types';

	let canvas: HTMLCanvasElement;
	let stageEl: HTMLDivElement;
	let scene: TrainingScene | null = null;
	let narrator: Narrator | null = null;

	let sections: StudySection[] = $state(studySections);
	let active: StudySection = $state(studySections[0]);
	let lessonIndex = $state(0);
	let lineIndex = $state(-1);
	let playing = $state(false);
	let revealCheck = $state(false);
	let expanded = $state(false);

	const lessons = $derived(active.lessons ?? null);
	const lesson = $derived(lessons ? lessons[Math.min(lessonIndex, lessons.length - 1)] : null);
	const activeLines = $derived<NarrationLine[]>(lesson?.lines ?? active.lines ?? []);
	const hasFocus = $derived(activeLines.some((l) => l.focus));
	const focusButtons = $derived<FocusButton[]>(
		active.scene === 'airspace'
			? airspaceFocus
			: active.scene === 'weather'
				? weatherFocus
				: active.scene === 'regulations'
					? regulationsFocus
					: active.scene === 'sectional'
						? sectionalFocus
						: active.scene === 'loading'
							? loadingFocus
							: []
	);

	// Keep the spoken line in view as narration advances (hands-free on phone).
	$effect(() => {
		lineIndex;
		if (lineIndex < 0) return;
		const el = document.querySelector('.cap.current');
		el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});

	// Re-fit the 3D scene whenever the stage expands/collapses.
	$effect(() => {
		expanded;
		requestAnimationFrame(() => scene?.resize());
	});

	function mountScene() {
		scene?.dispose();
		scene = null;
		if (active.scene === 'airspace') scene = createAirspaceScene(canvas);
		else if (active.scene === 'weather') scene = createWeatherScene(canvas);
		else if (active.scene === 'regulations') scene = createRegulationsScene(canvas);
		else if (active.scene === 'sectional') scene = createSectionalScene(canvas);
		else if (active.scene === 'loading') scene = createLoadingScene(canvas);
		scene?.resize();
	}

	function selectSection(s: StudySection) {
		if (!s.ready || s.id === active.id) return;
		narrator?.stop();
		lineIndex = -1;
		lessonIndex = 0;
		revealCheck = false;
		active = s;
		mountScene();
	}

	function selectLesson(i: number) {
		if (i === lessonIndex) return;
		narrator?.stop();
		lessonIndex = i;
		lineIndex = -1;
		revealCheck = false;
		scene?.focus(null);
	}

	function startNarration(from = 0) {
		narrator?.dispose();
		narrator = createNarrator(activeLines, {
			onLine: (i, line) => {
				lineIndex = i;
				if (scene) scene.focus(line.focus ?? null);
			},
			onState: (p) => (playing = p),
			onEnd: () => {
				playing = false;
				if (scene) scene.focus(null);
			}
		});
		narrator.play(from);
	}

	function toggleNarration() {
		if (playing) narrator?.pause();
		else if (lineIndex >= 0 && narrator) narrator.resume();
		else startNarration(0);
	}

	function jumpToLine(i: number) {
		startNarration(i);
	}

	onMount(() => {
		mountScene();
		const ro = new ResizeObserver(() => scene?.resize());
		ro.observe(stageEl);

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && expanded) expanded = false;
		};
		window.addEventListener('keydown', onKey);

		loadSections().then((s) => {
			if (s.length) {
				sections = s;
				const stillThere = s.find((x) => x.id === active.id);
				if (!stillThere) {
					active = s.find((x) => x.ready) ?? s[0];
					lessonIndex = 0;
					mountScene();
				}
			}
		});

		onDestroy(() => {
			ro.disconnect();
			window.removeEventListener('keydown', onKey);
			narrator?.dispose();
			scene?.dispose();
		});
	});
</script>

<svelte:head>
	<title>Skyshark Training — Part 107 Ground School</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="description" content="Interactive 3D Part 107 ground school that reads to you." />
</svelte:head>

<div class="wrap">
	<header class="bar">
		<a class="back" href="/skyshark">← game</a>
		<span class="title">TRAINING · {active.title}</span>
		<span class="spacer"></span>
	</header>

	<nav class="sections" aria-label="Sections">
		{#each sections as s (s.id)}
			<button
				class="chip"
				class:active={s.id === active.id}
				class:soon={!s.ready}
				disabled={!s.ready}
				onclick={() => selectSection(s)}
			>
				{s.title}{#if !s.ready}<span class="badge">soon</span>{/if}
			</button>
		{/each}
	</nav>

	{#if lessons}
		<nav class="lessons" aria-label="Lessons">
			{#each lessons as l, i (l.id)}
				<button class="lchip" class:active={i === lessonIndex} onclick={() => selectLesson(i)}>
					<span class="lnum">{i + 1}</span>{l.title}
				</button>
			{/each}
		</nav>
	{/if}

	<div class="stage" class:expanded bind:this={stageEl}>
		<canvas bind:this={canvas}></canvas>
		<button
			class="expand"
			onclick={() => (expanded = !expanded)}
			aria-label={expanded ? 'Minimize graph' : 'Fill window'}
			title={expanded ? 'Minimize (Esc)' : 'Fill window'}
		>
			{expanded ? '⤡' : '⤢'}
		</button>
		{#if active.scene === 'generic'}
			<div class="soon-overlay">
				<p>{active.title} — interactive lesson coming soon.</p>
			</div>
		{:else if hasFocus && focusButtons.length}
			<div class="focus-row">
				{#each focusButtons as b (b.key)}
					<button class="focus-btn" onclick={() => scene?.focus(b.key)}>{b.label}</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="panel">
		<div class="controls">
			<button class="listen" onclick={toggleNarration}>
				{playing ? '⏸ Pause' : lineIndex >= 0 ? '▶ Resume' : '▶ Listen'}
			</button>
			{#if lessons && lesson}
				<span class="progress">Lesson {lessonIndex + 1} of {lessons.length} · {lesson.title}</span>
			{:else}
				<span class="progress">{active.summary}</span>
			{/if}
		</div>

		<ol class="captions">
			{#each activeLines as line, i (i)}
				<li>
					<button class="cap" class:current={i === lineIndex} onclick={() => jumpToLine(i)}>
						{line.text}
					</button>
				</li>
			{/each}
		</ol>

		{#if lesson?.check}
			<div class="check">
				<p class="check-label">Quick check</p>
				<p class="check-q">{lesson.check.q}</p>
				{#if revealCheck}
					<p class="check-a">{lesson.check.a}</p>
				{:else}
					<button class="reveal" onclick={() => (revealCheck = true)}>Reveal answer</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.wrap {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: #06080f;
		color: #f4ecd8;
		padding: max(0.5rem, env(safe-area-inset-top)) 0.6rem max(0.6rem, env(safe-area-inset-bottom));
		box-sizing: border-box;
		gap: 0.55rem;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.back {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(244, 236, 216, 0.7);
		text-decoration: none;
	}
	.title {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		color: #ffb070;
	}
	.spacer {
		flex: 1;
	}

	.sections,
	.lessons {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.lessons {
		overflow-x: auto;
		flex-wrap: nowrap;
		-ms-overflow-style: none;
		scrollbar-width: none;
		padding-bottom: 0.1rem;
	}
	.lessons::-webkit-scrollbar {
		display: none;
	}
	.chip {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 176, 112, 0.28);
		background: transparent;
		color: #f4ecd8;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.chip.active {
		background: #ffb070;
		color: #06080f;
		border-color: #ffb070;
	}
	.chip.soon {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.badge {
		font-size: 0.55rem;
		opacity: 0.7;
	}

	.lchip {
		flex: 0 0 auto;
		font-size: 0.74rem;
		padding: 0.4rem 0.7rem;
		border-radius: 10px;
		border: 1px solid var(--color-border, rgba(244, 236, 216, 0.12));
		background: #0d1430;
		color: rgba(244, 236, 216, 0.75);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		white-space: nowrap;
	}
	.lchip.active {
		color: #f4ecd8;
		border-color: rgba(255, 176, 112, 0.6);
		background: #16204a;
	}
	.lnum {
		display: grid;
		place-items: center;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 6px;
		background: rgba(255, 176, 112, 0.18);
		color: #ffb070;
		font-family: var(--font-mono);
		font-size: 0.7rem;
	}

	.stage {
		position: relative;
		width: 100%;
		max-width: 760px;
		margin: 0 auto;
		flex: 1 1 auto;
		min-height: 220px;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 0 0 1px rgba(255, 176, 112, 0.18);
	}
	.stage.expanded {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		max-width: none;
		margin: 0;
		border-radius: 0;
		z-index: 60;
	}
	canvas {
		display: block;
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	.expand {
		position: absolute;
		top: max(0.6rem, env(safe-area-inset-top));
		right: max(0.6rem, env(safe-area-inset-right));
		width: 2.1rem;
		height: 2.1rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 176, 112, 0.3);
		background: rgba(6, 8, 15, 0.6);
		color: #ffd9b0;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		z-index: 2;
	}
	.expand:hover {
		background: rgba(255, 176, 112, 0.18);
	}

	.focus-row {
		position: absolute;
		left: 0.6rem;
		top: 0.6rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
	}
	.focus-btn {
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.6rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 176, 112, 0.3);
		background: rgba(6, 8, 15, 0.6);
		color: #ffd9b0;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		cursor: pointer;
	}
	.focus-btn:hover {
		background: rgba(255, 176, 112, 0.18);
	}

	.soon-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: rgba(244, 236, 216, 0.6);
		font-size: 0.9rem;
		padding: 1rem;
		text-align: center;
	}

	.panel {
		width: 100%;
		max-width: 760px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	.listen {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		padding: 0.7rem 1.1rem;
		border-radius: 12px;
		border: none;
		background: #ffb070;
		color: #06080f;
		font-weight: 600;
		cursor: pointer;
	}
	.progress {
		font-size: 0.78rem;
		color: rgba(244, 236, 216, 0.7);
	}

	.captions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: 30vh;
		overflow-y: auto;
	}
	.cap {
		text-align: left;
		width: 100%;
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.4;
		padding: 0.55rem 0.7rem;
		border-radius: 10px;
		border: 1px solid transparent;
		background: #0d1430;
		color: rgba(244, 236, 216, 0.7);
		cursor: pointer;
	}
	.cap:hover {
		color: #f4ecd8;
	}
	.cap.current {
		color: #06080f;
		background: #ffb070;
		border-color: #ffb070;
	}

	.check {
		border: 1px solid rgba(126, 217, 140, 0.35);
		background: rgba(126, 217, 140, 0.08);
		border-radius: 12px;
		padding: 0.75rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.check-label {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #aef0bb;
		margin: 0;
	}
	.check-q {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.4;
	}
	.check-a {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.45;
		color: #aef0bb;
	}
	.reveal {
		align-self: flex-start;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		padding: 0.5rem 0.9rem;
		border-radius: 9px;
		border: 1px solid rgba(126, 217, 140, 0.5);
		background: transparent;
		color: #aef0bb;
		cursor: pointer;
	}
</style>
