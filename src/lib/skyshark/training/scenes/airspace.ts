import * as THREE from 'three';
import type { FocusButton, TrainingScene } from '../types';

/**
 * Interactive 3D airspace scene. Five towers in a row — G, E, B, C, D — at
 * heights scaled from real altitudes (units = feet / 1000), each labeled.
 * Drag to orbit; it auto-rotates when idle. `focus(key)` highlights one class
 * (others dim) and eases the camera toward it — driven by the narration or by
 * the layer buttons in the UI.
 *
 * Mirrors the SceneHandle lifecycle used elsewhere in the repo
 * (src/lib/posts/animations/first-light/scene.ts).
 */

export type LayerKey = 'G' | 'E' | 'B' | 'C' | 'D';

/** Manual focus buttons shown over the scene for this lesson type. */
export const airspaceFocus: FocusButton[] = [
	{ key: 'G', label: 'G' },
	{ key: 'E', label: 'E' },
	{ key: 'B', label: 'B' },
	{ key: 'C', label: 'C' },
	{ key: 'D', label: 'D' }
];

interface LayerDef {
	key: LayerKey;
	x: number;
	color: number;
	label: string;
}

const LAYERS: LayerDef[] = [
	{ key: 'G', x: -9, color: 0x6cd58c, label: 'Class G\nuncontrolled' },
	{ key: 'E', x: -4.5, color: 0x8ab4f8, label: 'Class E\n700–1200 AGL' },
	{ key: 'B', x: 0, color: 0x4f8bff, label: 'Class B\nSFC–10,000' },
	{ key: 'C', x: 4.5, color: 0xff5d9e, label: 'Class C\nSFC–4,000' },
	{ key: 'D', x: 8.75, color: 0x66c2ff, label: 'Class D\nSFC–2,500' }
];

const ACCENT = 0xffb070;

/** Top of each tower in scene units (= feet / 1000), used to frame the camera. */
const LAYER_TOP: Record<LayerKey, number> = { G: 1.2, E: 14.5, B: 10, C: 4, D: 2.5 };

export function createAirspaceScene(canvas: HTMLCanvasElement): TrainingScene {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x06080f, 1);

	const scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x06080f, 28, 64);

	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

	scene.add(new THREE.AmbientLight(0xffffff, 0.65));
	const key = new THREE.DirectionalLight(0xffffff, 0.9);
	key.position.set(6, 18, 12);
	scene.add(key);
	const rim = new THREE.DirectionalLight(0xffb070, 0.35);
	rim.position.set(-10, 6, -8);
	scene.add(rim);

	// Ground grid
	const grid = new THREE.GridHelper(60, 30, 0x2a3350, 0x161c30);
	(grid.material as THREE.Material).transparent = true;
	(grid.material as THREE.Material).opacity = 0.5;
	scene.add(grid);

	// Per-layer groups, so we can highlight/dim each class as a unit.
	const groups = new Map<LayerKey, THREE.Group>();
	const mats: THREE.MeshStandardMaterial[] = [];

	function mat(color: number) {
		const m = new THREE.MeshStandardMaterial({
			color,
			transparent: true,
			opacity: 0.5,
			roughness: 0.4,
			metalness: 0.0,
			emissive: new THREE.Color(color),
			emissiveIntensity: 0.12
		});
		mats.push(m);
		return m;
	}

	/** A translucent cylinder slab from y0..y1 with radius r. */
	function slab(r: number, y0: number, y1: number, m: THREE.Material): THREE.Mesh {
		const h = y1 - y0;
		const geo = new THREE.CylinderGeometry(r, r, h, 48, 1, true);
		const mesh = new THREE.Mesh(geo, m);
		mesh.position.y = y0 + h / 2;
		return mesh;
	}

	function makeLabel(text: string, color: number): THREE.Sprite {
		const c = document.createElement('canvas');
		c.width = 256;
		c.height = 128;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
		ctx.font = '600 30px ui-monospace, monospace';
		ctx.textAlign = 'center';
		const lines = text.split('\n');
		lines.forEach((ln, idx) => {
			ctx.globalAlpha = idx === 0 ? 1 : 0.7;
			ctx.font = idx === 0 ? '600 30px ui-monospace, monospace' : '400 22px ui-monospace, monospace';
			ctx.fillText(ln, 128, 44 + idx * 34);
		});
		const tex = new THREE.CanvasTexture(c);
		tex.anisotropy = 4;
		const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
		const sprite = new THREE.Sprite(spriteMat);
		sprite.scale.set(5, 2.5, 1);
		return sprite;
	}

	for (const def of LAYERS) {
		const g = new THREE.Group();
		g.position.x = def.x;
		let top = 1.2;

		if (def.key === 'G') {
			g.add(slab(2.4, 0, 1.2, mat(def.color)));
			top = 1.2;
		} else if (def.key === 'E') {
			g.add(slab(1.7, 1.2, 14.5, mat(def.color))); // floor 1200 AGL up toward Class A
			top = 14.5;
		} else if (def.key === 'B') {
			// upside-down wedding cake
			g.add(slab(1.6, 0, 3, mat(def.color)));
			g.add(slab(2.3, 3, 6, mat(def.color)));
			g.add(slab(3.0, 6, 10, mat(def.color)));
			top = 10;
		} else if (def.key === 'C') {
			g.add(slab(1.0, 0, 4, mat(def.color))); // core
			g.add(slab(2.0, 1.2, 4, mat(def.color))); // shelf
			top = 4;
		} else if (def.key === 'D') {
			g.add(slab(1.1, 0, 2.5, mat(def.color)));
			top = 2.5;
		}

		const label = makeLabel(def.label, def.color);
		label.position.set(0, top + 1.4, 0);
		g.add(label);

		groups.set(def.key, g);
		scene.add(g);
	}

	// Class A ceiling hint line at 18,000.
	{
		const c = document.createElement('canvas');
		c.width = 256;
		c.height = 64;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = '#9aa0a6';
		ctx.font = '400 22px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('Class A · 18,000 MSL', 128, 40);
		const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
		sprite.scale.set(7, 1.8, 1);
		sprite.position.set(0, 18, 0);
		scene.add(sprite);
	}

	// Drone ceiling: the Part 107 limit is 400 ft AGL (= 0.4 units). Drawing it
	// shows how low drone ops actually are — below nearly every controlled shelf.
	{
		const lineMat = new THREE.MeshStandardMaterial({
			color: ACCENT,
			emissive: ACCENT,
			emissiveIntensity: 0.85,
			transparent: true,
			opacity: 0.95
		});
		const line = new THREE.Mesh(new THREE.BoxGeometry(22, 0.06, 0.06), lineMat);
		line.position.set(-0.1, 0.4, 4.4);
		scene.add(line);
		mats.push(lineMat);

		const c = document.createElement('canvas');
		c.width = 320;
		c.height = 64;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = '#ffb070';
		ctx.font = '600 24px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText('Drones ≤ 400 ft AGL', 6, 40);
		const sprite = new THREE.Sprite(
			new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })
		);
		sprite.scale.set(7, 1.4, 1);
		sprite.position.set(-6.5, 1.1, 4.4);
		scene.add(sprite);
	}

	// ---- Orbit (manual) ----
	let azimuth = 0.18;
	let elevation = 0.26;
	let radius = 32;
	let targetX = 0;
	let targetY = 6;
	let wantAz = azimuth;
	let wantRadius = 32;
	let wantTargetX = 0;
	let wantTargetY = 6;
	let autoRotate = true;

	let dragging = false;
	let lastX = 0;
	let lastY = 0;

	function onDown(e: PointerEvent) {
		dragging = true;
		autoRotate = false;
		lastX = e.clientX;
		lastY = e.clientY;
		canvas.setPointerCapture(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		wantAz -= (e.clientX - lastX) * 0.008;
		elevation = Math.max(0.05, Math.min(1.2, elevation + (e.clientY - lastY) * 0.006));
		lastX = e.clientX;
		lastY = e.clientY;
	}
	function onUp() {
		dragging = false;
	}
	canvas.addEventListener('pointerdown', onDown);
	canvas.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);

	function focus(req: string | null) {
		const keyOf: LayerKey | null = req && req in LAYER_TOP ? (req as LayerKey) : null;
		autoRotate = keyOf === null;
		for (const [k, g] of groups) {
			const focused = keyOf === null || k === keyOf;
			g.traverse((o) => {
				const mm = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
				if (mm && mm.emissive !== undefined) {
					mm.opacity = focused ? 0.62 : 0.12;
					mm.emissiveIntensity = k === keyOf ? 0.5 : 0.12;
					mm.emissive = new THREE.Color(k === keyOf ? ACCENT : (mm.color as THREE.Color).getHex());
				}
			});
		}
		if (keyOf) {
			const def = LAYERS.find((l) => l.key === keyOf)!;
			const top = LAYER_TOP[keyOf];
			wantTargetX = def.x;
			// Look at the middle of the tower, and pull the camera back far enough
			// that the whole tower (plus its label) fits — tall classes like E
			// zoom out, short ones like D come in close.
			wantTargetY = top * 0.5 + 1;
			wantRadius = Math.max(13, top * 1.7 + 7);
		} else {
			wantTargetX = 0;
			wantTargetY = 6;
			wantRadius = 32;
		}
	}

	let raf = 0;
	let W = 1;
	let H = 1;

	function resize() {
		const rect = canvas.getBoundingClientRect();
		W = Math.max(1, rect.width);
		H = Math.max(1, rect.height);
		renderer.setSize(W, H, false);
		camera.aspect = W / H;
		camera.updateProjectionMatrix();
	}

	function frame() {
		if (autoRotate) wantAz += 0.0016;
		azimuth += (wantAz - azimuth) * 0.08;
		radius += (wantRadius - radius) * 0.06;
		targetX += (wantTargetX - targetX) * 0.06;
		targetY += (wantTargetY - targetY) * 0.06;

		const ox = radius * Math.cos(elevation) * Math.sin(azimuth);
		const oy = radius * Math.sin(elevation);
		const oz = radius * Math.cos(elevation) * Math.cos(azimuth);
		camera.position.set(targetX + ox, targetY + oy, oz);
		camera.lookAt(targetX, targetY, 0);

		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	}

	resize();
	focus(null);
	raf = requestAnimationFrame(frame);

	return {
		resize,
		focus,
		dispose() {
			cancelAnimationFrame(raf);
			canvas.removeEventListener('pointerdown', onDown);
			canvas.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			scene.traverse((o) => {
				const mesh = o as THREE.Mesh;
				if (mesh.geometry) mesh.geometry.dispose();
			});
			mats.forEach((m) => m.dispose());
			renderer.dispose();
		}
	};
}
