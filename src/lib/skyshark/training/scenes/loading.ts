import * as THREE from 'three';
import type { FocusButton, TrainingScene } from '../types';

/**
 * Loading & Performance scene. A drone reacts to how it's loaded and flown:
 *  - weight: it sags toward the MAX GROSS WEIGHT line with a payload aboard.
 *  - cg: an off-center payload shifts the CG, the drone tips, and a marker
 *    slides out of the green zone on a CG-envelope bar.
 *  - loadfactor: the drone banks into a turn (maneuvers raise load factor).
 *  - density: a hot sun + thin air, so it can't climb (hovers low).
 *
 * Conforms to TrainingScene (resize / focus / dispose).
 */

export const loadingFocus: FocusButton[] = [
	{ key: 'weight', label: 'Weight' },
	{ key: 'cg', label: 'CG' },
	{ key: 'loadfactor', label: 'Load factor' },
	{ key: 'density', label: 'Density alt' }
];

const ACCENT = 0xffb070;
const GREEN = 0x7ed98c;
const RED = 0xff5d6c;

export function createLoadingScene(canvas: HTMLCanvasElement): TrainingScene {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);
	const ambient = new THREE.AmbientLight(0xffffff, 0.75);
	scene.add(ambient);
	const sun = new THREE.DirectionalLight(0xfff0dd, 0.9);
	sun.position.set(-6, 16, 10);
	scene.add(sun);

	const grid = new THREE.GridHelper(50, 25, 0x2a3350, 0x161c30);
	(grid.material as THREE.Material).transparent = true;
	(grid.material as THREE.Material).opacity = 0.5;
	scene.add(grid);

	// Drone (tiltable group).
	const drone = new THREE.Group();
	const dMat = new THREE.MeshStandardMaterial({ color: 0x2c303d, roughness: 0.6 });
	const rMat = new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.3 });
	drone.add(new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), dMat));
	for (const [dx, dz] of [
		[1, 1],
		[1, -1],
		[-1, 1],
		[-1, -1]
	]) {
		const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 20), rMat);
		rotor.position.set(dx * 1.5, 0.2, dz * 1.5);
		drone.add(rotor);
	}
	// payload box (slides to show CG offset)
	const payload = new THREE.Mesh(
		new THREE.BoxGeometry(0.9, 0.9, 0.9),
		new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.2 })
	);
	payload.position.set(0, 0.7, 0);
	payload.visible = false;
	drone.add(payload);
	drone.position.set(0, 5, 0);
	scene.add(drone);

	// MAX GROSS WEIGHT line.
	const maxLineMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.25 });
	const maxLine = new THREE.Mesh(new THREE.BoxGeometry(14, 0.08, 0.08), maxLineMat);
	maxLine.position.set(0, 3.2, 0);
	scene.add(maxLine);

	// CG envelope bar on the ground.
	const cgBar = new THREE.Group();
	cgBar.position.set(0, 0.1, 7);
	const barBase = new THREE.Mesh(
		new THREE.BoxGeometry(10, 0.2, 0.6),
		new THREE.MeshStandardMaterial({ color: 0x2c303d })
	);
	cgBar.add(barBase);
	const barGreen = new THREE.Mesh(
		new THREE.BoxGeometry(3, 0.22, 0.62),
		new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.5 })
	);
	cgBar.add(barGreen);
	const marker = new THREE.Mesh(
		new THREE.BoxGeometry(0.3, 1, 0.9),
		new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.5 })
	);
	marker.position.y = 0.4;
	cgBar.add(marker);
	scene.add(cgBar);

	// Sun (for density altitude).
	const orb = new THREE.Mesh(
		new THREE.SphereGeometry(1.3, 18, 18),
		new THREE.MeshBasicMaterial({ color: 0xffd27a })
	);
	orb.position.set(-13, 14, -8);
	scene.add(orb);

	// label
	const labelCanvas = document.createElement('canvas');
	labelCanvas.width = 512;
	labelCanvas.height = 96;
	const labelTex = new THREE.CanvasTexture(labelCanvas);
	const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
	labelSprite.scale.set(13, 2.4, 1);
	labelSprite.position.set(0, 9, 0);
	scene.add(labelSprite);
	function setLabel(text: string) {
		const ctx = labelCanvas.getContext('2d')!;
		ctx.clearRect(0, 0, 512, 96);
		ctx.fillStyle = '#ffd9b0';
		ctx.font = '600 30px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(text, 256, 58);
		labelTex.needsUpdate = true;
	}

	// ---- state ----
	let wantRoll = 0;
	let roll = 0;
	let wantCg = 0; // marker / payload offset (-1..1 → world)
	let cg = 0;
	let wantY = 5;
	let wantPayload = 0;
	let payloadAmt = 0;
	let wantDensity = 0;
	let density = 0;
	let maneuver = false;
	let tick = 0;

	function focus(req: string | null) {
		switch (req) {
			case 'weight':
				wantPayload = 1;
				wantY = 3.5;
				wantCg = 0;
				wantRoll = 0;
				wantDensity = 0;
				maneuver = false;
				maxLineMat.opacity = 0.7;
				setLabel('Max gross weight — heavier = less climb');
				break;
			case 'cg':
				wantPayload = 1;
				wantY = 5;
				wantCg = 0.7;
				wantRoll = 0.28;
				wantDensity = 0;
				maneuver = false;
				maxLineMat.opacity = 0.25;
				setLabel('CG off-center → tips · keep it in the green');
				break;
			case 'loadfactor':
				wantPayload = 0;
				wantY = 5.5;
				wantCg = 0;
				wantRoll = 0.6;
				wantDensity = 0;
				maneuver = true;
				maxLineMat.opacity = 0.25;
				setLabel('Maneuvers raise load factor');
				break;
			case 'density':
				wantPayload = 0;
				wantY = 3.2;
				wantCg = 0;
				wantRoll = 0;
				wantDensity = 1;
				maneuver = false;
				maxLineMat.opacity = 0.25;
				setLabel('High density altitude → less lift & thrust');
				break;
			default:
				wantPayload = 0;
				wantY = 5;
				wantCg = 0;
				wantRoll = 0;
				wantDensity = 0;
				maneuver = false;
				maxLineMat.opacity = 0.25;
				setLabel('');
		}
	}

	// orbit
	let azimuth = 0.6;
	let elevation = 0.28;
	let radius = 26;
	let wantAz = azimuth;
	let autoRotate = true;
	let dragging = false;
	let lastX = 0;
	let lastY2 = 0;
	function onDown(e: PointerEvent) {
		dragging = true;
		autoRotate = false;
		lastX = e.clientX;
		lastY2 = e.clientY;
		canvas.setPointerCapture(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		wantAz -= (e.clientX - lastX) * 0.008;
		elevation = Math.max(0.08, Math.min(1.1, elevation + (e.clientY - lastY2) * 0.006));
		lastX = e.clientX;
		lastY2 = e.clientY;
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
		roll += (wantRoll - roll) * 0.07;
		cg += (wantCg - cg) * 0.07;
		payloadAmt += (wantPayload - payloadAmt) * 0.08;
		density += (wantDensity - density) * 0.05;

		// gentle circular maneuver for load factor
		let baseY = wantY;
		drone.position.y += (baseY + Math.sin(tick * 1.6) * 0.15 - drone.position.y) * 0.06;
		if (maneuver) {
			drone.position.x = Math.sin(tick * 1.2) * 5;
			drone.position.z = Math.cos(tick * 1.2) * 5;
		} else {
			drone.position.x += (0 - drone.position.x) * 0.06;
			drone.position.z += (0 - drone.position.z) * 0.06;
		}
		drone.rotation.z = roll;

		// payload + CG offset
		payload.visible = payloadAmt > 0.05;
		payload.scale.setScalar(0.3 + payloadAmt);
		payload.position.x = cg * 1.2;

		// CG marker + green zone (green if |cg|<~0.4)
		marker.position.x = cg * 3.5;
		const inLimits = Math.abs(cg) < 0.42;
		(marker.material as THREE.MeshStandardMaterial).color.setHex(inLimits ? GREEN : RED);
		(marker.material as THREE.MeshStandardMaterial).emissive.setHex(inLimits ? GREEN : RED);

		// density: warm light + sun bigger, dim sun otherwise
		sun.color.setHex(density > 0.5 ? 0xff9a55 : 0xfff0dd);
		orb.scale.setScalar(1 + density * 0.5);
		(orb.material as THREE.MeshBasicMaterial).color.setHex(density > 0.5 ? 0xff8a3d : 0xffd27a);

		if (autoRotate) wantAz += 0.0016;
		azimuth += (wantAz - azimuth) * 0.08;
		const cx = radius * Math.cos(elevation) * Math.sin(azimuth);
		const cy = 5 + radius * Math.sin(elevation);
		const cz = radius * Math.cos(elevation) * Math.cos(azimuth);
		camera.position.set(cx, cy, cz);
		camera.lookAt(0, 4, 0);

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
			labelTex.dispose();
			renderer.dispose();
		}
	};
}
