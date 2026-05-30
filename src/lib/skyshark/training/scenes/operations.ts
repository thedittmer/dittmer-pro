import * as THREE from 'three';
import type { FocusButton, TrainingScene } from '../types';

/**
 * Operations scene — an airport with a runway and a crewed airplane flying the
 * standard rectangular traffic pattern (left turns), plus a windsock. Helps the
 * Airport Operations lesson: know the pattern and runway numbering so you can
 * stay clear of manned traffic. Focus: pattern / runway / wind.
 *
 * Conforms to TrainingScene (resize / focus / dispose).
 */

export const operationsFocus: FocusButton[] = [
	{ key: 'pattern', label: 'Pattern' },
	{ key: 'runway', label: 'Runway' },
	{ key: 'wind', label: 'Wind' }
];

const ACCENT = 0xffb070;

function labelSprite(text: string, scaleX = 7): THREE.Sprite {
	const c = document.createElement('canvas');
	c.width = 512;
	c.height = 96;
	const ctx = c.getContext('2d')!;
	ctx.fillStyle = '#ffd9b0';
	ctx.font = '600 30px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.fillText(text, 256, 58);
	const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
	s.scale.set(scaleX, (scaleX / 512) * 96, 1);
	return s;
}

export function createOperationsScene(canvas: HTMLCanvasElement): TrainingScene {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x06080f, 1);

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);
	scene.add(new THREE.AmbientLight(0xffffff, 0.75));
	const sun = new THREE.DirectionalLight(0xffffff, 0.85);
	sun.position.set(6, 18, 8);
	scene.add(sun);

	const grid = new THREE.GridHelper(60, 30, 0x2a3350, 0x161c30);
	(grid.material as THREE.Material).transparent = true;
	(grid.material as THREE.Material).opacity = 0.45;
	scene.add(grid);

	// Runway along X.
	const runway = new THREE.Mesh(
		new THREE.BoxGeometry(18, 0.1, 3),
		new THREE.MeshStandardMaterial({ color: 0x20242e })
	);
	runway.position.y = 0.05;
	scene.add(runway);
	// dashed centerline
	for (let x = -7.5; x <= 7.5; x += 2.2) {
		const dash = new THREE.Mesh(
			new THREE.BoxGeometry(1, 0.12, 0.18),
			new THREE.MeshBasicMaterial({ color: 0xe8e8e8 })
		);
		dash.position.set(x, 0.11, 0);
		scene.add(dash);
	}
	const rwNumA = labelSprite('27', 3);
	rwNumA.position.set(-8.2, 0.6, 0);
	scene.add(rwNumA);
	const rwNumB = labelSprite('9', 2);
	rwNumB.position.set(8.2, 0.6, 0);
	scene.add(rwNumB);

	// Traffic pattern (rectangular loop in the air, to one side).
	const pts = [
		new THREE.Vector3(8, 3, -2),
		new THREE.Vector3(8, 3, -12),
		new THREE.Vector3(-8, 3, -12),
		new THREE.Vector3(-8, 3, -2)
	];
	const patternMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.4 });
	const patternLoop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), patternMat);
	scene.add(patternLoop);

	// Airplane that flies the pattern.
	const plane = new THREE.Group();
	const planeMat = new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.4 });
	const fuse = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.4, 12), planeMat);
	fuse.rotation.x = Math.PI / 2; // point +Z
	plane.add(fuse);
	const wing = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.4), planeMat);
	plane.add(wing);
	scene.add(plane);

	// Windsock.
	const sock = new THREE.Group();
	const pole = new THREE.Mesh(
		new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8),
		new THREE.MeshStandardMaterial({ color: 0x9aa0a6 })
	);
	pole.position.y = 1.2;
	const cone = new THREE.Mesh(
		new THREE.ConeGeometry(0.4, 1.6, 12, 1, true),
		new THREE.MeshStandardMaterial({ color: ACCENT, side: THREE.DoubleSide })
	);
	cone.rotation.z = Math.PI / 2;
	cone.position.set(1, 2.3, 0);
	sock.add(pole, cone);
	sock.position.set(0, 0, 5);
	scene.add(sock);

	const label = labelSprite('', 11);
	label.position.set(0, 8, -6);
	scene.add(label);
	function setLabel(t: string) {
		const ctx = (label.material.map!.image as HTMLCanvasElement).getContext('2d')!;
		ctx.clearRect(0, 0, 512, 96);
		ctx.fillStyle = '#ffd9b0';
		ctx.font = '600 30px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(t, 256, 58);
		label.material.map!.needsUpdate = true;
	}

	let tick = 0;
	let wantPattern = 0.4;
	let wantTargetX = 0;
	let wantTargetZ = -4;
	let wantRadius = 30;

	function focus(req: string | null) {
		switch (req) {
			case 'pattern':
				wantPattern = 1;
				wantTargetX = 0;
				wantTargetZ = -7;
				wantRadius = 26;
				setLabel('Standard pattern · left turns');
				break;
			case 'runway':
				wantPattern = 0.2;
				wantTargetX = 0;
				wantTargetZ = 0;
				wantRadius = 18;
				setLabel('Runway number = magnetic heading, ÷10');
				break;
			case 'wind':
				wantPattern = 0.2;
				wantTargetX = 0;
				wantTargetZ = 3;
				wantRadius = 18;
				setLabel('Windsock shows wind — land into it');
				break;
			default:
				wantPattern = 0.4;
				wantTargetX = 0;
				wantTargetZ = -4;
				wantRadius = 30;
				setLabel('');
		}
	}

	// orbit
	let azimuth = 0.5;
	let elevation = 0.5;
	let radius = 30;
	let targetX = 0;
	let targetZ = -4;
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
	function resize() {
		const rect = canvas.getBoundingClientRect();
		const W = Math.max(1, rect.width);
		const H = Math.max(1, rect.height);
		renderer.setSize(W, H, false);
		camera.aspect = W / H;
		camera.updateProjectionMatrix();
	}

	function frame() {
		tick += 0.016;
		patternMat.opacity += (wantPattern - patternMat.opacity) * 0.08;

		// fly the pattern
		const n = pts.length;
		const t = (tick * 0.25) % n;
		const i = Math.floor(t);
		const frac = t - i;
		const a = pts[i];
		const b = pts[(i + 1) % n];
		plane.position.lerpVectors(a, b, frac);
		const dir = b.clone().sub(a);
		plane.rotation.y = Math.atan2(dir.x, dir.z);
		plane.visible = patternMat.opacity > 0.25;

		// windsock sway
		cone.rotation.y = Math.sin(tick) * 0.3;

		// camera
		if (autoRotate) wantAz += 0.0015;
		azimuth += (wantAz - azimuth) * 0.08;
		radius += (wantRadius - radius) * 0.06;
		targetX += (wantTargetX - targetX) * 0.06;
		targetZ += (wantTargetZ - targetZ) * 0.06;
		const cx = targetX + radius * Math.cos(elevation) * Math.sin(azimuth);
		const cy = 3 + radius * Math.sin(elevation);
		const cz = targetZ + radius * Math.cos(elevation) * Math.cos(azimuth);
		camera.position.set(cx, cy, cz);
		camera.lookAt(targetX, 1.5, targetZ);

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
			renderer.dispose();
		}
	};
}
