import * as THREE from 'three';
import type { FocusButton, TrainingScene } from '../types';

/**
 * Sectional scene — bridges the 2D chart to the real 3D airspace. A stylized
 * sectional lies on the ground (tan, grid, MEF numbers); above it the airspace
 * volumes extrude upward from their boundary rings: Class B (solid blue wedding
 * cake), Class C (solid magenta), Class D (dashed blue). Focus highlights one
 * class, the airport symbols, or the Maximum Elevation Figures.
 *
 * Conforms to TrainingScene (resize / focus / dispose).
 */

export const sectionalFocus: FocusButton[] = [
	{ key: 'classB', label: 'Class B' },
	{ key: 'classC', label: 'Class C' },
	{ key: 'classD', label: 'Class D' },
	{ key: 'airport', label: 'Airports' },
	{ key: 'mef', label: 'MEF' }
];

const BLUE = 0x4f8bff;
const MAGENTA = 0xff5d9e;

function chartTexture(): THREE.Texture {
	const c = document.createElement('canvas');
	c.width = 512;
	c.height = 512;
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#cdbb90';
	ctx.fillRect(0, 0, 512, 512);
	ctx.strokeStyle = 'rgba(90,80,55,0.45)';
	ctx.lineWidth = 1;
	for (let i = 0; i <= 512; i += 64) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, 512);
		ctx.moveTo(0, i);
		ctx.lineTo(512, i);
		ctx.stroke();
	}
	// Maximum Elevation Figures (hundreds of ft MSL).
	ctx.fillStyle = '#2f3aa0';
	ctx.font = '700 30px ui-monospace, monospace';
	ctx.textAlign = 'center';
	const mefs = [
		['27', 128, 110],
		['31', 384, 150],
		['18', 150, 380],
		['44', 400, 400]
	] as const;
	for (const [t, x, y] of mefs) ctx.fillText(t, x, y);
	return new THREE.CanvasTexture(c);
}

function label(text: string, colorHex: number): THREE.Sprite {
	const c = document.createElement('canvas');
	c.width = 256;
	c.height = 64;
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
	ctx.font = '600 26px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.fillText(text, 128, 42);
	const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
	s.scale.set(6, 1.5, 1);
	return s;
}

interface Site {
	key: string;
	x: number;
	mats: THREE.MeshStandardMaterial[];
	ringMat: THREE.MeshBasicMaterial;
	emph: number;
	want: number;
}

export function createSectionalScene(canvas: HTMLCanvasElement): TrainingScene {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x06080f, 1);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);
	scene.add(new THREE.AmbientLight(0xffffff, 0.8));
	const sun = new THREE.DirectionalLight(0xffffff, 0.8);
	sun.position.set(6, 18, 10);
	scene.add(sun);

	// The chart on the ground.
	const chartTex = chartTexture();
	const chart = new THREE.Mesh(
		new THREE.PlaneGeometry(34, 34),
		new THREE.MeshBasicMaterial({ map: chartTex })
	);
	chart.rotation.x = -Math.PI / 2;
	scene.add(chart);

	const sites: Site[] = [];

	function volMat(color: number): THREE.MeshStandardMaterial {
		return new THREE.MeshStandardMaterial({
			color,
			transparent: true,
			opacity: 0.12,
			emissive: color,
			emissiveIntensity: 0.15
		});
	}
	function slab(r: number, y0: number, y1: number, m: THREE.Material): THREE.Mesh {
		const h = y1 - y0;
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1, true), m);
		mesh.position.y = y0 + h / 2;
		return mesh;
	}
	function ring(r: number, color: number): THREE.Mesh {
		const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
		const mesh = new THREE.Mesh(new THREE.RingGeometry(r - 0.12, r, 48), m);
		mesh.rotation.x = -Math.PI / 2;
		mesh.position.y = 0.04;
		return mesh;
	}

	function buildSite(key: string, x: number, color: number, lab: string, build: (g: THREE.Group, mats: THREE.MeshStandardMaterial[]) => number) {
		const g = new THREE.Group();
		g.position.x = x;
		const mats: THREE.MeshStandardMaterial[] = [];
		const topR = build(g, mats);
		const ringMesh = ring(topR, color);
		g.add(ringMesh);
		const l = label(lab, color);
		l.position.set(0, 0, 0);
		g.add(l);
		scene.add(g);
		sites.push({ key, x, mats, ringMat: ringMesh.material as THREE.MeshBasicMaterial, emph: 0.12, want: 0.12 });
		return { g, topLabel: l };
	}

	// Class C — solid magenta (core + shelf).
	{
		const r = buildSite('classC', -10, MAGENTA, 'Class C · magenta', (g, mats) => {
			const m1 = volMat(MAGENTA);
			const m2 = volMat(MAGENTA);
			mats.push(m1, m2);
			g.add(slab(1.2, 0, 4, m1));
			g.add(slab(2.4, 1.4, 4, m2));
			return 2.4;
		});
		r.topLabel.position.set(0, 5.2, 0);
	}
	// Class B — solid blue (wedding cake).
	{
		const r = buildSite('classB', 0, BLUE, 'Class B · blue', (g, mats) => {
			const a = volMat(BLUE);
			const b = volMat(BLUE);
			const c2 = volMat(BLUE);
			mats.push(a, b, c2);
			g.add(slab(1.6, 0, 3, a));
			g.add(slab(2.3, 3, 6, b));
			g.add(slab(3, 6, 9, c2));
			return 3;
		});
		r.topLabel.position.set(0, 10, 0);
	}
	// Class D — dashed blue (single).
	{
		const r = buildSite('classD', 10, BLUE, 'Class D · dashed', (g, mats) => {
			const m = volMat(BLUE);
			mats.push(m);
			g.add(slab(1.3, 0, 2.6, m));
			return 1.3;
		});
		r.topLabel.position.set(0, 3.6, 0);
	}

	// Airport symbol dots: magenta = no tower, blue = tower.
	const dotNoTower = new THREE.Mesh(
		new THREE.SphereGeometry(0.5, 16, 16),
		new THREE.MeshStandardMaterial({ color: MAGENTA, emissive: MAGENTA, emissiveIntensity: 0.3 })
	);
	dotNoTower.position.set(-4, 0.5, 9);
	const dotTower = new THREE.Mesh(
		new THREE.SphereGeometry(0.5, 16, 16),
		new THREE.MeshStandardMaterial({ color: BLUE, emissive: BLUE, emissiveIntensity: 0.3 })
	);
	dotTower.position.set(4, 0.5, 9);
	scene.add(dotNoTower, dotTower);
	const airportLabel = label('magenta = no tower · blue = tower', 0xffd9b0);
	airportLabel.scale.set(11, 1.4, 1);
	airportLabel.position.set(0, 2.4, 9);
	airportLabel.visible = false;
	scene.add(airportLabel);

	const mefLabel = label('MEF = hundreds of ft MSL', 0xffd9b0);
	mefLabel.scale.set(10, 1.4, 1);
	mefLabel.position.set(0, 7, 0);
	mefLabel.visible = false;
	scene.add(mefLabel);

	let airportEmph = 0;
	let wantAirport = 0;
	let tick = 0;

	function focus(req: string | null) {
		const isClass = req === 'classB' || req === 'classC' || req === 'classD';
		for (const s of sites) s.want = req === null ? 0.12 : s.key === req ? 0.6 : 0.05;
		wantAirport = req === 'airport' ? 1 : 0;
		airportLabel.visible = req === 'airport';
		mefLabel.visible = req === 'mef';
		// camera target
		if (isClass) {
			const s = sites.find((x) => x.key === req)!;
			wantTargetX = s.x;
			wantRadius = 22;
		} else {
			wantTargetX = 0;
			wantRadius = req === 'mef' ? 30 : 30;
		}
	}

	// orbit
	let azimuth = 0.6;
	let elevation = 0.42;
	let radius = 30;
	let wantRadius = 30;
	let targetX = 0;
	let wantTargetX = 0;
	let wantAz = azimuth;
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
		elevation = Math.max(0.12, Math.min(1.2, elevation + (e.clientY - lastY) * 0.006));
		lastX = e.clientX;
		lastY = e.clientY;
	}
	function onUp() {
		dragging = false;
	}
	canvas.addEventListener('pointerdown', onDown);
	canvas.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);

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
		tick += 0.016;
		for (const s of sites) {
			s.emph += (s.want - s.emph) * 0.08;
			for (const m of s.mats) m.opacity = s.emph;
			s.ringMat.opacity = 0.25 + s.emph;
		}
		airportEmph += (wantAirport - airportEmph) * 0.1;
		const pulse = 0.3 + airportEmph * (0.5 + 0.4 * Math.sin(tick * 4));
		(dotNoTower.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
		(dotTower.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;

		if (autoRotate) wantAz += 0.0016;
		azimuth += (wantAz - azimuth) * 0.08;
		radius += (wantRadius - radius) * 0.06;
		targetX += (wantTargetX - targetX) * 0.06;
		const cx = targetX + radius * Math.cos(elevation) * Math.sin(azimuth);
		const cy = 4 + radius * Math.sin(elevation);
		const cz = radius * Math.cos(elevation) * Math.cos(azimuth);
		camera.position.set(cx, cy, cz);
		camera.lookAt(targetX, 3, 0);

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
				const m = (o as THREE.Mesh).material as THREE.Material | undefined;
				if (m) m.dispose();
			});
			chartTex.dispose();
			renderer.dispose();
		}
	};
}
