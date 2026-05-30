import * as THREE from 'three';
import type { FocusButton, TrainingScene } from '../types';

/**
 * Regulations scene — the Part 107 "operating envelope." A drone flies above an
 * operator with the 400 ft AGL ceiling, a visual-line-of-sight range ring, a
 * speed limit, and a day/night toggle (with a blinking anti-collision light).
 * Focus cues from the narration animate the matching limit.
 *
 * Scale: 1 unit ≈ 50 ft, so the 400 ft ceiling sits at y = 8.
 * Conforms to TrainingScene (resize / focus / dispose).
 */

export const regulationsFocus: FocusButton[] = [
	{ key: 'altitude', label: 'Altitude' },
	{ key: 'speed', label: 'Speed' },
	{ key: 'vlos', label: 'VLOS' },
	{ key: 'night', label: 'Night' }
];

const ACCENT = 0xffb070;
const CEILING_Y = 8;

export function createRegulationsScene(canvas: HTMLCanvasElement): TrainingScene {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);

	const ambient = new THREE.AmbientLight(0xffffff, 0.7);
	scene.add(ambient);
	const sun = new THREE.DirectionalLight(0xfff0dd, 1.0);
	sun.position.set(-8, 16, 10);
	scene.add(sun);

	const grid = new THREE.GridHelper(60, 30, 0x2a3350, 0x161c30);
	(grid.material as THREE.Material).transparent = true;
	(grid.material as THREE.Material).opacity = 0.5;
	scene.add(grid);

	// Operator marker at origin.
	const op = new THREE.Group();
	const opMat = new THREE.MeshStandardMaterial({ color: 0xc3c6d6 });
	const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2, 12), opMat);
	body.position.y = 1;
	const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), opMat);
	headMesh.position.y = 2.3;
	op.add(body, headMesh);
	scene.add(op);

	// Drone (quad): body + 4 rotor discs + a blinking beacon.
	const drone = new THREE.Group();
	const droneMat = new THREE.MeshStandardMaterial({ color: 0x2c303d, roughness: 0.6 });
	const rotorMat = new THREE.MeshStandardMaterial({
		color: ACCENT,
		emissive: ACCENT,
		emissiveIntensity: 0.3
	});
	drone.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), droneMat));
	for (const [dx, dz] of [
		[1, 1],
		[1, -1],
		[-1, 1],
		[-1, -1]
	]) {
		const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.15), droneMat);
		arm.scale.x = 12;
		arm.position.set(dx * 0.6, 0, dz * 0.6);
		arm.lookAt(0, 0, 0);
		const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20), rotorMat);
		rotor.position.set(dx * 1.1, 0.12, dz * 1.1);
		drone.add(rotor);
	}
	const beacon = new THREE.Mesh(
		new THREE.SphereGeometry(0.16, 10, 10),
		new THREE.MeshBasicMaterial({ color: 0xff3b30 })
	);
	beacon.position.y = 0.32;
	drone.add(beacon);
	const beaconLight = new THREE.PointLight(0xff3b30, 0, 30);
	drone.add(beaconLight);
	drone.position.set(6, 4, 0);
	scene.add(drone);

	// 400 ft ceiling plane.
	const ceilMat = new THREE.MeshBasicMaterial({
		color: ACCENT,
		transparent: true,
		opacity: 0.1,
		side: THREE.DoubleSide
	});
	const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), ceilMat);
	ceiling.rotation.x = -Math.PI / 2;
	ceiling.position.y = CEILING_Y;
	scene.add(ceiling);

	// VLOS range ring on the ground.
	const ringMat = new THREE.MeshBasicMaterial({
		color: ACCENT,
		transparent: true,
		opacity: 0.18,
		side: THREE.DoubleSide
	});
	const ring = new THREE.Mesh(new THREE.RingGeometry(15.4, 16, 64), ringMat);
	ring.rotation.x = -Math.PI / 2;
	ring.position.y = 0.05;
	scene.add(ring);

	// VLOS sight line operator → drone.
	const lineGeo = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(0, 2.3, 0),
		new THREE.Vector3(6, 4, 0)
	]);
	const lineMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.25 });
	const sightLine = new THREE.Line(lineGeo, lineMat);
	scene.add(sightLine);

	// Sun / moon body.
	const orb = new THREE.Mesh(
		new THREE.SphereGeometry(1.4, 20, 20),
		new THREE.MeshBasicMaterial({ color: 0xffe7b0 })
	);
	orb.position.set(-14, 16, -10);
	scene.add(orb);

	// Dynamic label.
	const labelCanvas = document.createElement('canvas');
	labelCanvas.width = 512;
	labelCanvas.height = 96;
	const labelTex = new THREE.CanvasTexture(labelCanvas);
	const labelSprite = new THREE.Sprite(
		new THREE.SpriteMaterial({ map: labelTex, transparent: true })
	);
	labelSprite.scale.set(12, 2.25, 1);
	labelSprite.position.set(0, 11.5, 0);
	scene.add(labelSprite);
	function setLabel(text: string) {
		const ctx = labelCanvas.getContext('2d')!;
		ctx.clearRect(0, 0, 512, 96);
		ctx.fillStyle = '#ffd9b0';
		ctx.font = '600 32px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(text, 256, 58);
		labelTex.needsUpdate = true;
	}

	// ---- state ----
	let wantDroneY = 4;
	let wantCeil = 0.1;
	let wantRing = 0.18;
	let speedMode = false;
	let night = 0;
	let wantNight = 0;
	let tick = 0;

	function focus(req: string | null) {
		switch (req) {
			case 'altitude':
				wantDroneY = CEILING_Y - 0.6;
				wantCeil = 0.4;
				wantRing = 0.12;
				speedMode = false;
				wantNight = 0;
				setLabel('400 ft AGL — your ceiling');
				break;
			case 'speed':
				wantDroneY = 5;
				wantCeil = 0.1;
				wantRing = 0.12;
				speedMode = true;
				wantNight = 0;
				setLabel('100 mph (87 kt) max');
				break;
			case 'vlos':
				wantDroneY = 5;
				wantCeil = 0.1;
				wantRing = 0.5;
				speedMode = false;
				wantNight = 0;
				setLabel('Keep it in sight — VLOS');
				break;
			case 'night':
				wantDroneY = 5;
				wantCeil = 0.1;
				wantRing = 0.18;
				speedMode = false;
				wantNight = 1;
				setLabel('Night OK · anti-collision lights');
				break;
			default:
				wantDroneY = 4;
				wantCeil = 0.1;
				wantRing = 0.18;
				speedMode = false;
				wantNight = 0;
				setLabel('');
		}
	}

	// ---- orbit ----
	let azimuth = 0.7;
	let elevation = 0.3;
	let radius = 28;
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

	const dayBg = new THREE.Color(0x0b1430);
	const nightBg = new THREE.Color(0x05060c);
	const linePos = lineGeo.attributes.position as THREE.BufferAttribute;

	function frame() {
		tick += 0.016;

		// drone position
		const wantX = speedMode ? Math.sin(tick * 2) * 11 : 6;
		drone.position.x += (wantX - drone.position.x) * (speedMode ? 0.12 : 0.06);
		drone.position.y += (wantDroneY + Math.sin(tick * 1.6) * 0.2 - drone.position.y) * 0.06;
		drone.rotation.y += 0.01;

		// sight line follows the drone
		linePos.setXYZ(1, drone.position.x, drone.position.y, drone.position.z);
		linePos.needsUpdate = true;

		// emphasis easing
		ceilMat.opacity += (wantCeil - ceilMat.opacity) * 0.08;
		ringMat.opacity += (wantRing - ringMat.opacity) * 0.08;
		lineMat.opacity += ((wantRing > 0.3 ? 0.7 : 0.25) - lineMat.opacity) * 0.08;

		// day / night
		night += (wantNight - night) * 0.05;
		ambient.intensity = 0.7 - night * 0.45;
		sun.intensity = 1.0 - night * 0.8;
		(orb.material as THREE.MeshBasicMaterial).color.setHex(night > 0.5 ? 0xcdd3e0 : 0xffe7b0);
		renderer.setClearColor(dayBg.clone().lerp(nightBg, night), 1);
		// blinking beacon at night
		const blink = night > 0.4 && Math.sin(tick * 7) > 0.6 ? 1 : 0;
		beaconLight.intensity = blink * 4;
		(beacon.material as THREE.MeshBasicMaterial).color.setHex(blink ? 0xff6b60 : 0xff3b30);

		if (autoRotate) wantAz += 0.0016;
		azimuth += (wantAz - azimuth) * 0.08;
		const cx = radius * Math.cos(elevation) * Math.sin(azimuth);
		const cy = 5 + radius * Math.sin(elevation);
		const cz = radius * Math.cos(elevation) * Math.cos(azimuth);
		camera.position.set(cx, cy, cz);
		camera.lookAt(0, 4.5, 0);

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
