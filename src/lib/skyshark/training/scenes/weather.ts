import * as THREE from 'three';
import type { FocusButton, TrainingScene } from '../types';

/**
 * Interactive weather scene. A field of cloud puffs morphs between a flat
 * stratiform layer (stable air → smooth, hazy, poor visibility) and towering
 * cumulus (unstable air → turbulent, showery, good visibility). A wind vane
 * shows wind, fog density shows visibility, and a storm state darkens the sky
 * with lightning. Driven by the narration's focus cues or the focus buttons.
 *
 * Conforms to TrainingScene (resize / focus / dispose), mirroring first-light.
 */

export const weatherFocus: FocusButton[] = [
	{ key: 'stable', label: 'Stable' },
	{ key: 'unstable', label: 'Unstable' },
	{ key: 'wind', label: 'Wind' },
	{ key: 'fog', label: 'Fog' },
	{ key: 'storm', label: 'Storm' }
];

const TOWERS = [-8, -3, 3, 8];

function cloudTexture(): THREE.Texture {
	const c = document.createElement('canvas');
	c.width = 128;
	c.height = 128;
	const ctx = c.getContext('2d')!;
	const g = ctx.createRadialGradient(64, 64, 3, 64, 64, 62);
	g.addColorStop(0, 'rgba(255,255,255,0.95)');
	g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
	g.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.arc(64, 64, 62, 0, Math.PI * 2);
	ctx.fill();
	return new THREE.CanvasTexture(c);
}

interface Puff {
	sprite: THREE.Sprite;
	stable: THREE.Vector3;
	unstable: THREE.Vector3;
	phase: number;
}

export function createWeatherScene(canvas: HTMLCanvasElement): TrainingScene {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const fog = new THREE.FogExp2(0x0d1430, 0.014);
	scene.fog = fog;

	const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);

	const ambient = new THREE.AmbientLight(0xffffff, 0.7);
	scene.add(ambient);
	const sun = new THREE.DirectionalLight(0xfff0dd, 0.9);
	sun.position.set(8, 20, 10);
	scene.add(sun);
	const flash = new THREE.PointLight(0xcfe0ff, 0, 80);
	flash.position.set(3, 12, 0);
	scene.add(flash);

	const grid = new THREE.GridHelper(80, 32, 0x2a3350, 0x161c30);
	(grid.material as THREE.Material).transparent = true;
	(grid.material as THREE.Material).opacity = 0.45;
	scene.add(grid);

	const cloudTex = cloudTexture();
	const puffs: Puff[] = [];
	const N = 54;
	for (let i = 0; i < N; i++) {
		const mat = new THREE.SpriteMaterial({
			map: cloudTex,
			transparent: true,
			depthWrite: false,
			opacity: 0.9
		});
		const sprite = new THREE.Sprite(mat);
		const s = 3 + Math.random() * 2.5;
		sprite.scale.set(s, s, 1);

		// Stable: a wide, flat stratus sheet around y ≈ 6.
		const stable = new THREE.Vector3(
			-12 + Math.random() * 24,
			5.5 + Math.random() * 1.2,
			-7 + Math.random() * 14
		);
		// Unstable: clustered into a few tall cumulus towers.
		const tx = TOWERS[i % TOWERS.length];
		const t = (i % 14) / 14; // height fraction within a tower
		const unstable = new THREE.Vector3(
			tx + (Math.random() - 0.5) * 3,
			2 + t * 11 + Math.random() * 1.2,
			(Math.random() - 0.5) * 4
		);
		sprite.position.copy(stable);
		scene.add(sprite);
		puffs.push({ sprite, stable, unstable, phase: Math.random() * Math.PI * 2 });
	}

	// Wind vane: a shaft + arrowhead that points downwind.
	const wind = new THREE.Group();
	const arrowMat = new THREE.MeshStandardMaterial({
		color: 0xffb070,
		emissive: 0xffb070,
		emissiveIntensity: 0.5
	});
	const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6, 12), arrowMat);
	shaft.rotation.z = Math.PI / 2;
	const head = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 16), arrowMat);
	head.rotation.z = -Math.PI / 2;
	head.position.x = 3.5;
	wind.add(shaft, head);
	wind.position.set(0, 1.6, 7);
	scene.add(wind);

	// Dynamic caption label above the scene.
	const labelCanvas = document.createElement('canvas');
	labelCanvas.width = 512;
	labelCanvas.height = 96;
	const labelTex = new THREE.CanvasTexture(labelCanvas);
	const labelSprite = new THREE.Sprite(
		new THREE.SpriteMaterial({ map: labelTex, transparent: true })
	);
	labelSprite.scale.set(12, 2.25, 1);
	labelSprite.position.set(0, 14, 0);
	scene.add(labelSprite);

	function setLabel(text: string) {
		const ctx = labelCanvas.getContext('2d')!;
		ctx.clearRect(0, 0, 512, 96);
		ctx.fillStyle = '#ffd9b0';
		ctx.font = '600 34px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(text, 256, 58);
		labelTex.needsUpdate = true;
	}

	// ---- animated state ----
	let stability = 0.45;
	let wantStability = 0.45;
	let wantFog = 0.014;
	let windEmph = 1;
	let wantWindEmph = 1;
	let storm = false;
	let flashLevel = 0;
	let cloudDark = 0; // 0 = white, 1 = storm grey
	let wantCloudDark = 0;
	let tick = 0;

	function focus(req: string | null) {
		switch (req) {
			case 'stable':
				wantStability = 0;
				wantFog = 0.03;
				wantWindEmph = 1;
				storm = false;
				wantCloudDark = 0.15;
				setLabel('STABLE · stratus · poor vis · smooth');
				break;
			case 'unstable':
				wantStability = 1;
				wantFog = 0.006;
				wantWindEmph = 1.2;
				storm = false;
				wantCloudDark = 0;
				setLabel('UNSTABLE · cumulus · good vis · turbulent');
				break;
			case 'wind':
				wantStability = 0.5;
				wantFog = 0.012;
				wantWindEmph = 2.2;
				storm = false;
				wantCloudDark = 0;
				setLabel('WIND · direction + gusts');
				break;
			case 'fog':
				wantStability = 0;
				wantFog = 0.07;
				wantWindEmph = 0.7;
				storm = false;
				wantCloudDark = 0.1;
				setLabel('FOG · temp ≈ dewpoint · low vis');
				break;
			case 'storm':
				wantStability = 1;
				wantFog = 0.016;
				wantWindEmph = 1.8;
				storm = true;
				wantCloudDark = 0.85;
				setLabel('THUNDERSTORM · avoid · downbursts');
				break;
			default:
				wantStability = 0.45;
				wantFog = 0.014;
				wantWindEmph = 1;
				storm = false;
				wantCloudDark = 0;
				setLabel('');
		}
	}

	// ---- orbit ----
	let azimuth = 0.5;
	let elevation = 0.22;
	let radius = 34;
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
		elevation = Math.max(0.05, Math.min(1.1, elevation + (e.clientY - lastY) * 0.006));
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

	const tmp = new THREE.Vector3();
	const dark = new THREE.Color(0x6b7280);
	const white = new THREE.Color(0xffffff);

	function frame() {
		tick += 0.016;
		stability += (wantStability - stability) * 0.05;
		fog.density += (wantFog - fog.density) * 0.06;
		windEmph += (wantWindEmph - windEmph) * 0.08;
		cloudDark += (wantCloudDark - cloudDark) * 0.06;

		const turb = stability; // more unstable → more turbulence
		for (const p of puffs) {
			tmp.copy(p.stable).lerp(p.unstable, stability);
			tmp.x += Math.sin(tick * 0.8 + p.phase) * 0.25 * turb;
			tmp.y += Math.cos(tick * 0.9 + p.phase) * 0.35 * turb;
			p.sprite.position.lerp(tmp, 0.1);
			(p.sprite.material as THREE.SpriteMaterial).color.copy(white).lerp(dark, cloudDark);
		}

		// wind vane
		wind.rotation.y += 0.004 * windEmph;
		wind.scale.setScalar(0.8 + windEmph * 0.4);
		wind.position.y = 1.6 + Math.sin(tick) * 0.15;

		// lightning
		if (storm && Math.random() < 0.02) flashLevel = 1;
		flashLevel *= 0.86;
		flash.intensity = flashLevel * 6;

		if (autoRotate) wantAz += 0.0015;
		azimuth += (wantAz - azimuth) * 0.08;
		const cx = radius * Math.cos(elevation) * Math.sin(azimuth);
		const cy = 6 + radius * Math.sin(elevation);
		const cz = radius * Math.cos(elevation) * Math.cos(azimuth);
		camera.position.set(cx, cy, cz);
		camera.lookAt(0, 6, 0);

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
			cloudTex.dispose();
			labelTex.dispose();
			renderer.dispose();
		}
	};
}
