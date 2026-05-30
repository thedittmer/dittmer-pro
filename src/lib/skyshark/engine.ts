import type { Question } from './types';
import { domainTag } from './questions';

/**
 * Skyshark game engine — 2D canvas. Mirrors the SceneHandle lifecycle discipline
 * used elsewhere in the repo (play / pause / resume / reset / resize / dispose).
 *
 * Two modes share one engine:
 *  - 'study'  : the lowest enemy is the "target". Its Part 107 question drives the
 *               choice UI (rendered by Svelte). A correct answer destroys it. A wrong
 *               answer pauses the loop and surfaces the teaching overlay.
 *  - 'arcade' : no questions. Player slides left/right and auto-fires; enemies are
 *               destroyed by bullet collision.
 *
 * The engine owns the canvas only. All HUD / question / overlay UI lives in Svelte
 * and talks to the engine through the methods below + the onState callback.
 */

export type GameMode = 'study' | 'arcade';
export type GameStatus = 'ready' | 'playing' | 'paused' | 'teaching' | 'over';

export interface GameState {
	status: GameStatus;
	mode: GameMode;
	score: number;
	lives: number;
	best: number;
	streak: number;
	currentQuestion: Question | null;
	lastWrong: { question: Question; chosenId: string } | null;
}

export interface GameOptions {
	mode: GameMode;
	questions: Question[];
	best?: number;
	onState: (s: GameState) => void;
}

export interface GameHandle {
	play(): void;
	pause(): void;
	resume(): void;
	reset(opts?: Partial<Omit<GameOptions, 'onState'>>): void;
	answer(choiceId: string): void;
	setPointer(cssX: number): void;
	nudge(dir: -1 | 1): void;
	setMode(mode: GameMode): void;
	resize(): void;
	dispose(): void;
	getState(): GameState;
}

interface Enemy {
	id: number;
	x: number;
	y: number;
	vy: number;
	r: number;
	hue: string;
	tag: string;
	question: Question | null;
}
interface Bullet {
	x: number;
	y: number;
	vy: number;
}
interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	max: number;
	hue: string;
}
interface Star {
	x: number;
	y: number;
	v: number;
	s: number;
}

const ACCENT = '#ffb070';
const BULLET = '#ffe0c0';
const ENEMY = '#ff5d6c';
const START_LIVES = 3;

export function createGame(canvas: HTMLCanvasElement, options: GameOptions): GameHandle {
	const ctx = canvas.getContext('2d')!;

	let W = 360;
	let H = 640;
	let dpr = 1;

	let mode: GameMode = options.mode;
	let pool: Question[] = options.questions.slice();
	let queue: Question[] = [];

	const state: GameState = {
		status: 'ready',
		mode,
		score: 0,
		lives: START_LIVES,
		best: options.best ?? 0,
		streak: 0,
		currentQuestion: null,
		lastWrong: null
	};

	const player = { x: 180, y: 560, w: 30 };
	let pointerX = 180;
	let enemies: Enemy[] = [];
	let bullets: Bullet[] = [];
	let particles: Particle[] = [];
	let stars: Star[] = [];
	let nextId = 1;

	let raf = 0;
	let last = 0;
	let spawnTimer = 0;
	let fireTimer = 0;
	let flash = 0; // brief screen flash on a kill
	let running = false;

	function emit() {
		options.onState({ ...state });
	}

	function nextQuestion(): Question {
		if (queue.length === 0) queue = shuffleCopy(pool);
		return queue.pop() ?? pool[0];
	}

	function makeStars() {
		stars = [];
		const n = Math.floor((W * H) / 9000);
		for (let i = 0; i < n; i++) {
			stars.push({
				x: Math.random() * W,
				y: Math.random() * H,
				v: 20 + Math.random() * 60,
				s: Math.random() < 0.85 ? 1 : 2
			});
		}
	}

	function spawnEnemy() {
		const r = 20;
		const x = r + Math.random() * (W - 2 * r);
		// Study mode descends gently so there's time to read & think; arcade is brisk.
		const speed =
			mode === 'study'
				? 11 + Math.min(16, state.score * 0.02) + Math.random() * 6
				: 26 + Math.min(40, state.score * 0.05) + Math.random() * 14;
		const q = mode === 'study' ? nextQuestion() : null;
		enemies.push({
			id: nextId++,
			x,
			y: -r,
			vy: speed,
			r,
			hue: ENEMY,
			tag: q ? domainTag[q.domain] : '✦',
			question: q
		});
	}

	/** Study target = lowest (closest to player) living enemy. */
	function target(): Enemy | null {
		let t: Enemy | null = null;
		for (const e of enemies) if (!t || e.y > t.y) t = e;
		return t;
	}

	function syncQuestion() {
		if (mode !== 'study') {
			if (state.currentQuestion !== null) {
				state.currentQuestion = null;
				emit();
			}
			return;
		}
		const t = target();
		const q = t?.question ?? null;
		if (q !== state.currentQuestion) {
			state.currentQuestion = q;
			emit();
		}
	}

	function boom(x: number, y: number, hue: string) {
		for (let i = 0; i < 14; i++) {
			const a = Math.random() * Math.PI * 2;
			const sp = 40 + Math.random() * 140;
			particles.push({
				x,
				y,
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp,
				life: 0,
				max: 0.4 + Math.random() * 0.4,
				hue
			});
		}
	}

	function kill(e: Enemy, points: number) {
		boom(e.x, e.y, ACCENT);
		enemies = enemies.filter((x) => x !== e);
		state.score += points;
		flash = 0.12;
		emit(); // push the new score to the HUD (arcade kills happen inside the loop)
	}

	function loseLife(e: Enemy) {
		boom(e.x, e.y, ENEMY);
		enemies = enemies.filter((x) => x !== e);
		state.lives -= 1;
		state.streak = 0;
		if (state.lives <= 0) gameOver();
		else emit();
	}

	function gameOver() {
		state.status = 'over';
		state.best = Math.max(state.best, state.score);
		running = false;
		cancelAnimationFrame(raf);
		emit();
	}

	function update(dt: number) {
		// background
		for (const s of stars) {
			s.y += s.v * dt;
			if (s.y > H) {
				s.y = 0;
				s.x = Math.random() * W;
			}
		}

		// player movement: arcade follows pointer; study auto-aims at target
		if (mode === 'arcade') {
			player.x += (pointerX - player.x) * Math.min(1, dt * 12);
		} else {
			const t = target();
			const aim = t ? t.x : W / 2;
			player.x += (aim - player.x) * Math.min(1, dt * 6);
		}
		player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
		player.y = H - 70;

		// spawning
		spawnTimer -= dt;
		const maxEnemies = mode === 'study' ? 3 : 6;
		const interval = Math.max(0.6, (mode === 'study' ? 1.5 : 1.0) - state.score * 0.0015);
		if (spawnTimer <= 0 && enemies.length < maxEnemies) {
			spawnEnemy();
			spawnTimer = interval;
		}

		// arcade auto-fire
		if (mode === 'arcade') {
			fireTimer -= dt;
			if (fireTimer <= 0) {
				bullets.push({ x: player.x, y: player.y - 16, vy: -560 });
				fireTimer = 0.22;
			}
		}

		// enemies descend
		for (const e of enemies) e.y += e.vy * dt;

		// bullet movement + arcade collisions
		for (const b of bullets) b.y += b.vy * dt;
		bullets = bullets.filter((b) => b.y > -20);
		if (mode === 'arcade') {
			for (const b of bullets) {
				for (const e of enemies) {
					const dx = b.x - e.x;
					const dy = b.y - e.y;
					if (dx * dx + dy * dy < e.r * e.r) {
						b.y = -999;
						kill(e, 100);
						break;
					}
				}
			}
			bullets = bullets.filter((b) => b.y > -20);
		}

		// enemies reaching the bottom cost a life
		const floor = H - 40;
		for (const e of [...enemies]) {
			if (e.y - e.r > floor) loseLife(e);
		}

		// particles
		for (const p of particles) {
			p.life += dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vx *= 0.92;
			p.vy *= 0.92;
		}
		particles = particles.filter((p) => p.life < p.max);

		if (flash > 0) flash = Math.max(0, flash - dt);

		if (state.status === 'playing') syncQuestion();
	}

	function render() {
		// sky
		const g = ctx.createLinearGradient(0, 0, 0, H);
		g.addColorStop(0, '#06080f');
		g.addColorStop(1, '#0d1430');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, W, H);

		ctx.fillStyle = 'rgba(255,255,255,0.6)';
		for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);

		// bullets
		ctx.fillStyle = BULLET;
		for (const b of bullets) ctx.fillRect(b.x - 1.5, b.y - 8, 3, 12);

		// enemies
		ctx.font = '600 14px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const t = mode === 'study' ? target() : null;
		for (const e of enemies) {
			ctx.beginPath();
			ctx.moveTo(e.x, e.y + e.r);
			ctx.lineTo(e.x - e.r, e.y - e.r * 0.6);
			ctx.lineTo(e.x + e.r, e.y - e.r * 0.6);
			ctx.closePath();
			ctx.fillStyle = e.hue;
			ctx.fill();
			ctx.fillStyle = '#1a0205';
			ctx.fillText(e.tag, e.x, e.y - e.r * 0.05);
			if (e === t) {
				ctx.strokeStyle = ACCENT;
				ctx.lineWidth = 2;
				ctx.strokeRect(e.x - e.r - 6, e.y - e.r - 6, (e.r + 6) * 2, (e.r + 6) * 2);
			}
		}

		// player (triangle pointing up)
		ctx.save();
		ctx.shadowColor = ACCENT;
		ctx.shadowBlur = 14;
		ctx.fillStyle = ACCENT;
		ctx.beginPath();
		ctx.moveTo(player.x, player.y - 16);
		ctx.lineTo(player.x - player.w / 2, player.y + 12);
		ctx.lineTo(player.x + player.w / 2, player.y + 12);
		ctx.closePath();
		ctx.fill();
		ctx.restore();

		// particles
		for (const p of particles) {
			ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
			ctx.fillStyle = p.hue;
			ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
		}
		ctx.globalAlpha = 1;

		if (flash > 0) {
			ctx.fillStyle = `rgba(255,200,140,${flash * 1.2})`;
			ctx.fillRect(0, 0, W, H);
		}
	}

	function frame(now: number) {
		if (!running) return;
		const dt = Math.min(0.05, (now - last) / 1000 || 0);
		last = now;
		update(dt);
		render();
		raf = requestAnimationFrame(frame);
	}

	function startLoop() {
		if (running) return;
		running = true;
		last = performance.now();
		raf = requestAnimationFrame(frame);
	}
	function stopLoop() {
		running = false;
		cancelAnimationFrame(raf);
		// one static repaint so the frozen frame is correct
		render();
	}

	return {
		play() {
			state.status = 'playing';
			state.score = 0;
			state.lives = START_LIVES;
			state.streak = 0;
			state.lastWrong = null;
			enemies = [];
			bullets = [];
			particles = [];
			queue = shuffleCopy(pool);
			spawnTimer = 0;
			fireTimer = 0;
			pointerX = W / 2;
			emit();
			startLoop();
			syncQuestion();
		},
		pause() {
			if (state.status !== 'playing') return;
			state.status = 'paused';
			stopLoop();
			emit();
		},
		resume() {
			if (state.status !== 'paused' && state.status !== 'teaching') return;
			state.status = 'playing';
			state.lastWrong = null;
			emit();
			startLoop();
		},
		reset(opts) {
			stopLoop();
			if (opts?.mode) mode = opts.mode;
			if (opts?.questions) pool = opts.questions.slice();
			if (typeof opts?.best === 'number') state.best = opts.best;
			state.status = 'ready';
			state.mode = mode;
			state.score = 0;
			state.lives = START_LIVES;
			state.streak = 0;
			state.currentQuestion = null;
			state.lastWrong = null;
			enemies = [];
			bullets = [];
			particles = [];
			render();
			emit();
		},
		answer(choiceId: string) {
			if (state.status !== 'playing' || mode !== 'study') return;
			const t = target();
			if (!t || !t.question) return;
			if (choiceId === t.question.correctAnswer) {
				state.streak += 1;
				kill(t, 100 + state.streak * 10);
				// tracer
				boom(player.x, player.y - 10, BULLET);
				emit();
				syncQuestion();
			} else {
				state.status = 'teaching';
				state.streak = 0;
				state.lastWrong = { question: t.question, chosenId: choiceId };
				stopLoop();
				emit();
			}
		},
		setPointer(cssX: number) {
			pointerX = Math.max(0, Math.min(W, cssX));
		},
		nudge(dir) {
			pointerX = Math.max(0, Math.min(W, pointerX + dir * 48));
		},
		setMode(m) {
			mode = m;
			state.mode = m;
			emit();
		},
		resize() {
			const rect = canvas.getBoundingClientRect();
			W = Math.max(1, rect.width);
			H = Math.max(1, rect.height);
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			player.y = H - 70;
			if (pointerX === 180) pointerX = W / 2;
			makeStars();
			render();
		},
		dispose() {
			stopLoop();
		},
		getState() {
			return { ...state };
		}
	};
}

function shuffleCopy<T>(arr: T[]): T[] {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
