<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { createGame, type GameHandle, type GameState, type GameMode } from '$lib/skyshark/engine';
	import { pickQuestions, domainLabels, domains } from '$lib/skyshark/questions';
	import type { Domain, Question } from '$lib/skyshark/types';
	import { saveScore, bestScore } from '$lib/skyshark/scores';

	let canvas: HTMLCanvasElement;
	let stageEl: HTMLDivElement;
	let game: GameHandle | null = null;

	let view: GameState = $state({
		status: 'ready',
		mode: 'study',
		score: 0,
		lives: 3,
		best: 0,
		streak: 0,
		currentQuestion: null,
		lastWrong: null
	});

	let mode: GameMode = $state('study');
	let domain: Domain | 'all' = $state('all');
	let playerName = $state('');
	let saved = $state(false);
	let savedBest = $state(0);
	let showIosHint = $state(false);
	/** When on, the game reads the question/choices and the correct answer aloud. On by default. */
	let readAloud = $state(true);
	let lastSpokenQid = '';
	/** Keys (`game/<id>/prompt|answer`) that have a pre-rendered Kokoro clip. */
	let audioManifest = $state<Set<string>>(new Set());
	let gameAudio: HTMLAudioElement | null = null;

	const wrongChoiceText: string = $derived(
		view.lastWrong
			? (view.lastWrong.question.choices.find((c) => c.id === view.lastWrong!.chosenId)?.text ?? '')
			: ''
	);
	const correctChoiceText: string = $derived(
		view.lastWrong
			? (view.lastWrong.question.choices.find(
					(c) => c.id === view.lastWrong!.question.correctAnswer
				)?.text ?? '')
			: ''
	);

	// ---- Read-aloud (browser speech; dynamic so it reads whatever's on screen) ----
	function pickVoice(): SpeechSynthesisVoice | null {
		if (!browser || !('speechSynthesis' in window)) return null;
		const voices = window.speechSynthesis.getVoices();
		for (const name of ['Samantha', 'Ava', 'Allison', 'Google US English']) {
			const v = voices.find((v) => v.name.includes(name));
			if (v) return v;
		}
		return voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null;
	}
	function speak(text: string) {
		if (!browser || !('speechSynthesis' in window)) return;
		window.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		const v = pickVoice();
		if (v) u.voice = v;
		window.speechSynthesis.speak(u);
	}
	function stopSpeech() {
		if (browser && 'speechSynthesis' in window) window.speechSynthesis.cancel();
	}
	function stopGameAudio() {
		if (gameAudio) {
			gameAudio.pause();
			gameAudio = null;
		}
		stopSpeech();
	}
	/** Prefer the pre-rendered Kokoro clip; fall back to browser speech if absent. */
	function playClipOrSpeak(key: string, fallback: string) {
		stopGameAudio();
		if (audioManifest.has(key)) {
			const el = new Audio(`/skyshark/audio/${key}.mp3`);
			gameAudio = el;
			el.onerror = () => {
				if (gameAudio === el) gameAudio = null;
				speak(fallback);
			};
			void el.play().catch(() => {
				if (gameAudio === el) gameAudio = null;
				speak(fallback);
			});
		} else {
			speak(fallback);
		}
	}
	function questionRead(q: Question): string {
		const p = q.prompt.kind === 'text' ? q.prompt.text : q.prompt.alt;
		return `${p} ${q.choices.map((c, i) => `Option ${i + 1}, ${c.text}.`).join(' ')}`;
	}
	function toggleReadAloud() {
		readAloud = !readAloud;
		try {
			localStorage.setItem('skyshark.readAloud', readAloud ? '1' : '0');
		} catch {
			/* ignore */
		}
		if (!readAloud) stopGameAudio();
		else lastSpokenQid = ''; // allow the current question to be read immediately
	}

	// Read the current question + choices when it changes (study mode, mid-play).
	$effect(() => {
		const q = view.currentQuestion;
		if (!readAloud || mode !== 'study' || view.status !== 'playing' || !q) return;
		if (q.id === lastSpokenQid) return;
		lastSpokenQid = q.id;
		playClipOrSpeak(`game/${q.id}/prompt`, questionRead(q));
	});
	// Read the correct answer when the teaching overlay appears.
	$effect(() => {
		if (readAloud && view.status === 'teaching' && view.lastWrong) {
			const q = view.lastWrong.question;
			playClipOrSpeak(`game/${q.id}/answer`, `The correct answer is, ${correctChoiceText}. ${q.explanation}`);
		}
	});
	// Stop talking when not in an active question.
	$effect(() => {
		if (view.status === 'ready' || view.status === 'over' || view.status === 'paused') {
			stopGameAudio();
			lastSpokenQid = '';
		}
	});
	// The read-aloud toggle is the master audio switch: it also mutes game SFX.
	// Read `readAloud` unconditionally so it's always tracked as a dependency —
	// `game?.…` would short-circuit and drop the dependency while game is null.
	$effect(() => {
		const on = readAloud;
		game?.setSound(on);
	});

	function build() {
		game = createGame(canvas, {
			mode,
			questions: pickQuestions(domain),
			best: bestScore(),
			onState: (s) => (view = s)
		});
		game.setSound(readAloud); // sync master-audio state to a freshly built game
		game.resize();
	}

	function start() {
		saved = false;
		game?.reset({ mode, questions: pickQuestions(domain), best: bestScore() });
		game?.play();
	}

	function choose(id: string) {
		game?.answer(id);
	}
	function continueAfterWrong() {
		game?.resume();
	}
	async function submitScore() {
		savedBest = await saveScore(playerName, view.score);
		saved = true;
	}

	function onKey(e: KeyboardEvent) {
		if (view.status === 'teaching') {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				continueAfterWrong();
			}
			return;
		}
		if (view.status !== 'playing') return;
		if (mode === 'study' && view.currentQuestion) {
			const n = parseInt(e.key, 10);
			if (n >= 1 && n <= view.currentQuestion.choices.length) {
				choose(view.currentQuestion.choices[n - 1].id);
			} else if (/^[a-d]$/i.test(e.key)) {
				const c = view.currentQuestion.choices.find((c) => c.id === e.key.toLowerCase());
				if (c) choose(c.id);
			}
		} else if (mode === 'arcade') {
			if (e.key === 'ArrowLeft') game?.nudge(-1);
			else if (e.key === 'ArrowRight') game?.nudge(1);
		}
	}

	// Arcade: drag to steer.
	function pointerMove(e: PointerEvent) {
		if (mode !== 'arcade' || view.status !== 'playing') return;
		const rect = canvas.getBoundingClientRect();
		game?.setPointer(e.clientX - rect.left);
	}

	function dismissIosHint() {
		showIosHint = false;
		try {
			localStorage.setItem('skyshark.iosHint', '1');
		} catch {
			/* ignore */
		}
	}

	onMount(() => {
		build();
		const onResize = () => game?.resize();
		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKey);

		// Re-measure once the flex layout has settled and on any size change
		// (orientation, font load, address-bar collapse). Window 'resize' alone
		// fires too early / not at all for these.
		const ro = new ResizeObserver(() => game?.resize());
		ro.observe(stageEl);

		// Load the Kokoro clip manifest (absent → browser-speech fallback).
		fetch('/skyshark/audio/manifest.json')
			.then((r) => (r.ok ? r.json() : []))
			.then((arr) => {
				if (Array.isArray(arr)) audioManifest = new Set(arr);
			})
			.catch(() => {});

		if (browser) {
			const ua = navigator.userAgent;
			const isIos = /iPhone|iPad|iPod/.test(ua);
			const standalone =
				(navigator as unknown as { standalone?: boolean }).standalone === true ||
				window.matchMedia('(display-mode: standalone)').matches;
			const dismissed = localStorage.getItem('skyshark.iosHint') === '1';
			showIosHint = isIos && !standalone && !dismissed;
			try {
				const stored = localStorage.getItem('skyshark.readAloud');
				if (stored !== null) readAloud = stored === '1'; // else keep default (on)
			} catch {
				/* ignore */
			}
		}

		onDestroy(() => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKey);
			ro.disconnect();
			stopGameAudio();
			game?.dispose();
		});
	});
</script>

<svelte:head>
	<title>Skyshark — Part 107 Trainer</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
	/>
	<meta
		name="description"
		content="An arcade shooter that trains you for the FAA Part 107 drone exam."
	/>
	<link rel="manifest" href="/skyshark.webmanifest" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Skyshark" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<div class="wrap">
	<div class="stage" bind:this={stageEl}>
		<canvas bind:this={canvas} onpointermove={pointerMove} onpointerdown={pointerMove}></canvas>

		{#if view.status === 'playing' || view.status === 'teaching'}
			<div class="hud">
				<span class="pill">SCORE {view.score}</span>
				<span class="pill"
					>{'♥'.repeat(view.lives)}{'·'.repeat(Math.max(0, 3 - view.lives))}</span
				>
				<span class="pill">BEST {Math.max(view.best, view.score)}</span>
			</div>
			<button
				class="snd-toggle"
				onclick={toggleReadAloud}
				aria-pressed={readAloud}
				aria-label="Toggle read aloud"
				title="Read aloud"
			>
				{readAloud ? '🔊' : '🔇'}
			</button>
		{/if}

		{#if view.status === 'ready'}
			<div class="overlay">
				<div class="panel">
					<h1>SKYSHARK</h1>
					<p class="tag">Part 107 trainer · shoot what you know</p>

					<div class="seg" role="group" aria-label="Mode">
						<button class:active={mode === 'study'} onclick={() => (mode = 'study')}>Study</button>
						<button class:active={mode === 'arcade'} onclick={() => (mode = 'arcade')}>Arcade</button>
					</div>

					{#if mode === 'study'}
						<label class="field">
							<span>Topic</span>
							<select bind:value={domain}>
								<option value="all">All topics</option>
								{#each domains as d}
									<option value={d}>{domainLabels[d]}</option>
								{/each}
							</select>
						</label>
						<p class="hint">
							Answer the question to fire on the marked enemy. Wrong answers show you the right one.
						</p>
						<button
							class="readaloud"
							class:on={readAloud}
							onclick={toggleReadAloud}
							aria-pressed={readAloud}
						>
							{readAloud ? '🔊' : '🔇'} Read aloud: {readAloud ? 'On' : 'Off'}
						</button>
					{:else}
						<p class="hint">Drag to steer · auto-fire. Just blow stuff up — no studying.</p>
					{/if}

					<button class="play" onclick={start}>PLAY</button>
					<a class="train" href="/skyshark/training">📖 Training — learn it first</a>
					<a
						class="train"
						href="https://www.faa.gov/faq/where-can-i-find-study-materials-part-107-aeronautical-knowledge-test"
						target="_blank"
						rel="noopener"
					>
						📝 FAA practice test ↗
					</a>
				</div>
			</div>
		{/if}

		{#if view.status === 'teaching' && view.lastWrong}
			<div class="overlay">
				<div class="panel teach">
					<p class="teach-q">
						{view.lastWrong.question.prompt.kind === 'text'
							? view.lastWrong.question.prompt.text
							: view.lastWrong.question.prompt.alt}
					</p>
					<p class="teach-row wrong"><span>Your answer</span>{wrongChoiceText}</p>
					<p class="teach-row right"><span>Correct</span>{correctChoiceText}</p>
					<p class="teach-why">{view.lastWrong.question.explanation}</p>
					<p class="teach-src">{view.lastWrong.question.sourceRef.locator}</p>
					<button class="play" onclick={continueAfterWrong}>OK, GOT IT</button>
				</div>
			</div>
		{/if}

		{#if view.status === 'over'}
			<div class="overlay">
				<div class="panel">
					<h1 class="small">GAME OVER</h1>
					<p class="bigscore">{view.score}</p>
					<p class="tag">best {Math.max(view.best, savedBest, view.score)}</p>
					{#if !saved}
						<label class="field">
							<span>Name for the board</span>
							<input bind:value={playerName} maxlength="16" placeholder="PILOT" />
						</label>
						<button class="play ghost" onclick={submitScore}>SAVE SCORE</button>
					{:else}
						<p class="hint">Saved.</p>
					{/if}
					<button class="play" onclick={start}>PLAY AGAIN</button>
					<a class="back" href="/">← back to site</a>
				</div>
			</div>
		{/if}
	</div>

	{#if view.status === 'playing' && mode === 'study' && view.currentQuestion}
		<div class="study">
			<p class="prompt">
				{view.currentQuestion.prompt.kind === 'text'
					? view.currentQuestion.prompt.text
					: view.currentQuestion.prompt.alt}
			</p>
			<div class="choices">
				{#each view.currentQuestion.choices as c, i (c.id)}
					<button class="choice" onclick={() => choose(c.id)}>
						<span class="key">{i + 1}</span>{c.text}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if view.status === 'playing' && mode === 'arcade'}
		<p class="arcade-hint">Drag to steer · auto-fire</p>
	{/if}

	{#if showIosHint}
		<div class="ios-hint">
			<span>Add Skyshark to your home screen: tap Share → “Add to Home Screen”.</span>
			<button onclick={dismissIosHint} aria-label="Dismiss">✕</button>
		</div>
	{/if}
</div>

<style>
	.wrap {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #06080f;
		padding: max(0.5rem, env(safe-area-inset-top)) 0.5rem max(0.5rem, env(safe-area-inset-bottom));
		box-sizing: border-box;
		gap: 0.6rem;
	}

	.stage {
		position: relative;
		width: 100%;
		max-width: 460px;
		flex: 1 1 auto;
		min-height: 0;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 0 0 1px rgba(255, 176, 112, 0.18);
	}
	canvas {
		display: block;
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	.hud {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		right: 0.5rem;
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
		pointer-events: none;
	}
	.pill {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		letter-spacing: 0.1em;
		color: #ffd9b0;
		background: rgba(6, 8, 15, 0.55);
		border: 1px solid rgba(255, 176, 112, 0.25);
		border-radius: 999px;
		padding: 0.2rem 0.55rem;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: rgba(6, 8, 15, 0.78);
		backdrop-filter: blur(3px);
		padding: 1rem;
	}
	.panel {
		width: 100%;
		max-width: 360px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		color: #f4ecd8;
	}
	h1 {
		font-family: var(--font-mono);
		letter-spacing: 0.22em;
		font-size: 2rem;
		margin: 0;
		color: #ffb070;
		text-shadow: 0 0 24px rgba(255, 176, 112, 0.5);
	}
	h1.small {
		font-size: 1.3rem;
		letter-spacing: 0.18em;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(244, 236, 216, 0.6);
		margin: 0;
	}
	.hint {
		font-size: 0.82rem;
		color: rgba(244, 236, 216, 0.7);
		margin: 0;
		line-height: 1.4;
	}

	.seg {
		display: flex;
		gap: 0.4rem;
		justify-content: center;
	}
	.seg button {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		padding: 0.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 176, 112, 0.3);
		background: transparent;
		color: #f4ecd8;
		cursor: pointer;
	}
	.seg button.active {
		background: #ffb070;
		color: #06080f;
		border-color: #ffb070;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		text-align: left;
	}
	.field span {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(244, 236, 216, 0.6);
	}
	select,
	input {
		font: inherit;
		padding: 0.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 176, 112, 0.3);
		background: #0d1430;
		color: #f4ecd8;
	}

	.play {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		letter-spacing: 0.16em;
		padding: 0.85rem;
		border-radius: 12px;
		border: none;
		background: #ffb070;
		color: #06080f;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.2rem;
	}
	.play.ghost {
		background: transparent;
		color: #ffb070;
		border: 1px solid rgba(255, 176, 112, 0.4);
	}
	.train {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffb070;
		text-decoration: none;
		padding: 0.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 176, 112, 0.35);
	}
	.train:hover {
		background: rgba(255, 176, 112, 0.12);
	}
	.readaloud {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.55rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 176, 112, 0.3);
		background: transparent;
		color: rgba(244, 236, 216, 0.7);
		cursor: pointer;
	}
	.readaloud.on {
		background: #ffb070;
		color: #06080f;
		border-color: #ffb070;
	}
	.snd-toggle {
		position: absolute;
		top: 2.6rem;
		right: 0.5rem;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 176, 112, 0.3);
		background: rgba(6, 8, 15, 0.6);
		color: #ffd9b0;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		z-index: 5;
	}
	.snd-toggle:hover {
		background: rgba(255, 176, 112, 0.18);
	}
	.back {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(244, 236, 216, 0.55);
		text-decoration: none;
		margin-top: 0.2rem;
	}

	.bigscore {
		font-family: var(--font-mono);
		font-size: 3rem;
		color: #ffb070;
		margin: 0;
		line-height: 1;
	}

	.teach {
		text-align: left;
		max-width: 380px;
	}
	.teach-q {
		font-size: 0.95rem;
		line-height: 1.4;
		margin: 0 0 0.2rem;
	}
	.teach-row {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.9rem;
		margin: 0;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		line-height: 1.35;
	}
	.teach-row span {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.7;
	}
	.teach-row.wrong {
		background: rgba(255, 93, 108, 0.14);
		color: #ffb4bc;
	}
	.teach-row.right {
		background: rgba(126, 217, 140, 0.14);
		color: #aef0bb;
	}
	.teach-why {
		font-size: 0.85rem;
		color: rgba(244, 236, 216, 0.85);
		line-height: 1.45;
		margin: 0.1rem 0 0;
	}
	.teach-src {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		color: rgba(244, 236, 216, 0.45);
		margin: 0;
	}

	.study {
		width: 100%;
		max-width: 460px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prompt {
		font-size: 0.92rem;
		line-height: 1.35;
		color: #f4ecd8;
		margin: 0;
		text-align: center;
		min-height: 2.4em;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.choice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-align: left;
		font: inherit;
		font-size: 0.84rem;
		line-height: 1.25;
		padding: 0.7rem;
		min-height: 3.4rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 176, 112, 0.28);
		background: #0d1430;
		color: #f4ecd8;
		cursor: pointer;
	}
	.choice:active {
		background: #16204a;
	}
	.choice .key {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 6px;
		background: rgba(255, 176, 112, 0.18);
		color: #ffb070;
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}
	@media (max-width: 380px) {
		.choices {
			grid-template-columns: 1fr;
		}
	}

	.arcade-hint {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(244, 236, 216, 0.5);
		margin: 0;
	}

	.ios-hint {
		position: fixed;
		bottom: max(0.6rem, env(safe-area-inset-bottom));
		left: 0.6rem;
		right: 0.6rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: #131313;
		border: 1px solid rgba(255, 176, 112, 0.3);
		border-radius: 12px;
		padding: 0.7rem 0.8rem;
		font-size: 0.78rem;
		color: #f4ecd8;
		z-index: 50;
	}
	.ios-hint button {
		margin-left: auto;
		background: none;
		border: none;
		color: rgba(244, 236, 216, 0.6);
		font-size: 1rem;
		cursor: pointer;
	}
</style>
