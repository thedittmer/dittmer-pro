import * as THREE from 'three';
import { range, bell, easeIn, easeInOut, easeOut, easeOutQuint, lerp } from './timeline';
import { createTextLine, type TextLine } from './text';

export type SceneHandle = {
	play: () => void;
	pause: () => void;
	reset: () => void;
	setTime: (t: number) => void;
	getTime: () => number;
	getDuration: () => number;
	resize: (w: number, h: number) => void;
	dispose: () => void;
	onProgress: (cb: (t: number) => void) => void;
};

const DURATION = 15.0;
const PARTICLE_COUNT = 1800;

const POEM = [
	'before the world remembered its name —',
	'a small light asked the dark to dance,',
	'and morning learned to keep the secret.'
] as const;

export async function createScene(canvas: HTMLCanvasElement): Promise<SceneHandle> {
	// ---------- Renderer ----------
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.setClearColor(0x000000, 1);

	// ---------- Scene + Camera ----------
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
	camera.position.set(0, 0, 8);
	camera.lookAt(0, 0, 0);

	// ---------- Sky (gradient sphere) ----------
	const skyGeo = new THREE.SphereGeometry(60, 48, 24);
	const skyUniforms = {
		uDawn: { value: 0 },
		uPulse: { value: 0 }
	};
	const skyMat = new THREE.ShaderMaterial({
		uniforms: skyUniforms,
		vertexShader: /* glsl */ `
			varying vec3 vWorld;
			void main() {
				vec4 wp = modelMatrix * vec4(position, 1.0);
				vWorld = wp.xyz;
				gl_Position = projectionMatrix * viewMatrix * wp;
			}
		`,
		fragmentShader: /* glsl */ `
			uniform float uDawn;
			uniform float uPulse;
			varying vec3 vWorld;

			// Cheap hash for subtle starfield grain
			float hash(vec2 p) {
				p = fract(p * vec2(123.34, 456.21));
				p += dot(p, p + 45.32);
				return fract(p.x * p.y);
			}

			void main() {
				vec3 n = normalize(vWorld);
				float h = n.y;

				// Night palette (deep, with a hint of indigo near the floor)
				vec3 nZenith   = vec3(0.005, 0.006, 0.020);
				vec3 nHorizon  = vec3(0.020, 0.020, 0.060);
				vec3 night = mix(nHorizon, nZenith, smoothstep(-0.2, 0.85, h));

				// Subtle stars in night sky
				vec2 sp = n.xy * 80.0 + n.z * 30.0;
				float star = step(0.997, hash(floor(sp)));
				star *= smoothstep(0.1, 0.6, h);
				night += vec3(star) * 0.6 * (1.0 - uDawn);

				// Dawn palette
				vec3 dZenith   = vec3(0.04, 0.06, 0.18);
				vec3 dHorizon  = vec3(1.00, 0.55, 0.35);
				vec3 dBelow    = vec3(0.18, 0.10, 0.20);
				vec3 dawn;
				if (h > 0.0) {
					dawn = mix(dHorizon, dZenith, smoothstep(0.0, 0.75, h));
				} else {
					dawn = mix(dHorizon, dBelow, smoothstep(0.0, -0.5, h));
				}

				vec3 col = mix(night, dawn, uDawn);

				// Warm bloom ramp during the "dance" moment, biased to horizon
				float bloomBand = smoothstep(-0.15, 0.35, h) * (1.0 - smoothstep(0.35, 0.9, h));
				col += vec3(0.45, 0.20, 0.08) * uPulse * bloomBand * 0.55;

				gl_FragColor = vec4(col, 1.0);
			}
		`,
		side: THREE.BackSide,
		depthWrite: false
	});
	const sky = new THREE.Mesh(skyGeo, skyMat);
	scene.add(sky);

	// ---------- Particles ----------
	// Each particle keeps an initial position (in a wide box), a target sphere
	// position (the "form" it joins at the dance), and an explode direction.
	const positions = new Float32Array(PARTICLE_COUNT * 3);
	const sizes = new Float32Array(PARTICLE_COUNT);
	const seeds = new Float32Array(PARTICLE_COUNT);

	const initialPos = new Float32Array(PARTICLE_COUNT * 3);
	const targetPos = new Float32Array(PARTICLE_COUNT * 3);
	const explodeDir = new Float32Array(PARTICLE_COUNT * 3);

	for (let i = 0; i < PARTICLE_COUNT; i++) {
		// Initial: wide drifting cloud
		const ix = (Math.random() - 0.5) * 18;
		const iy = (Math.random() - 0.5) * 12;
		const iz = -3 + Math.random() * 8;
		initialPos[i * 3 + 0] = ix;
		initialPos[i * 3 + 1] = iy;
		initialPos[i * 3 + 2] = iz;

		// Target: thin spherical shell around origin
		const u = Math.random();
		const v = Math.random();
		const theta = 2 * Math.PI * u;
		const phi = Math.acos(2 * v - 1);
		const r = 1.4 + Math.random() * 0.25;
		const tx = r * Math.sin(phi) * Math.cos(theta);
		const ty = r * Math.sin(phi) * Math.sin(theta);
		const tz = r * Math.cos(phi);
		targetPos[i * 3 + 0] = tx;
		targetPos[i * 3 + 1] = ty;
		targetPos[i * 3 + 2] = tz;

		// Explode dir: roughly outward from sphere, with a slight upward bias
		const len = Math.hypot(tx, ty, tz) || 1;
		const upBias = 0.4;
		const ex = tx / len + (Math.random() - 0.5) * 0.3;
		const ey = ty / len + upBias + (Math.random() - 0.5) * 0.2;
		const ez = tz / len + (Math.random() - 0.5) * 0.3;
		const elen = Math.hypot(ex, ey, ez) || 1;
		explodeDir[i * 3 + 0] = ex / elen;
		explodeDir[i * 3 + 1] = ey / elen;
		explodeDir[i * 3 + 2] = ez / elen;

		positions[i * 3 + 0] = ix;
		positions[i * 3 + 1] = iy;
		positions[i * 3 + 2] = iz;
		sizes[i] = 1.6 + Math.random() * 2.6;
		seeds[i] = Math.random() * Math.PI * 2;
	}

	const particleGeo = new THREE.BufferGeometry();
	particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	particleGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
	particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

	const particleUniforms = {
		uTime: { value: 0 },
		uColor: { value: new THREE.Color('#ffd9a8') },
		uGlow: { value: 0.4 },
		uOpacity: { value: 0.8 },
		uPixelRatio: { value: renderer.getPixelRatio() }
	};
	const particleMat = new THREE.ShaderMaterial({
		uniforms: particleUniforms,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexShader: /* glsl */ `
			attribute float aSize;
			attribute float aSeed;
			uniform float uTime;
			uniform float uPixelRatio;
			varying float vTwinkle;
			void main() {
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				gl_Position = projectionMatrix * mv;
				float tw = 0.6 + 0.4 * sin(uTime * 1.6 + aSeed * 6.28);
				vTwinkle = tw;
				gl_PointSize = aSize * uPixelRatio * (90.0 / -mv.z) * tw;
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 uColor;
			uniform float uGlow;
			uniform float uOpacity;
			varying float vTwinkle;
			void main() {
				vec2 uv = gl_PointCoord - 0.5;
				float d = length(uv);
				float core = smoothstep(0.5, 0.0, d);
				float halo = smoothstep(0.5, 0.15, d);
				float a = pow(core, 2.0) + halo * uGlow * 0.35;
				a *= uOpacity * vTwinkle;
				gl_FragColor = vec4(uColor, a);
			}
		`
	});
	const particles = new THREE.Points(particleGeo, particleMat);
	scene.add(particles);

	// ---------- Light core (the "small light") ----------
	const coreGeo = new THREE.SphereGeometry(0.28, 32, 24);
	const coreMat = new THREE.MeshBasicMaterial({ color: '#fff3d6', transparent: true, opacity: 0 });
	const core = new THREE.Mesh(coreGeo, coreMat);
	scene.add(core);

	// Halo sprite around the core for bloom feel without postprocessing
	const haloMat = new THREE.SpriteMaterial({
		map: makeRadialTexture(),
		color: 0xffd9a0,
		transparent: true,
		opacity: 0,
		depthWrite: false,
		blending: THREE.AdditiveBlending
	});
	const halo = new THREE.Sprite(haloMat);
	halo.scale.set(2.4, 2.4, 1);
	scene.add(halo);

	// Larger soft glow for the sun moment
	const sunGlowMat = new THREE.SpriteMaterial({
		map: makeRadialTexture(),
		color: 0xffb070,
		transparent: true,
		opacity: 0,
		depthWrite: false,
		blending: THREE.AdditiveBlending
	});
	const sunGlow = new THREE.Sprite(sunGlowMat);
	sunGlow.scale.set(7, 7, 1);
	scene.add(sunGlow);

	// ---------- Horizon ----------
	// A long, dark plane far below the camera that becomes visible at dawn.
	const horizonGeo = new THREE.PlaneGeometry(120, 30, 1, 1);
	const horizonMat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			uOpacity: { value: 0 },
			uColorTop: { value: new THREE.Color('#3a1f2c') },
			uColorBottom: { value: new THREE.Color('#06050a') }
		},
		vertexShader: /* glsl */ `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: /* glsl */ `
			uniform float uOpacity;
			uniform vec3 uColorTop;
			uniform vec3 uColorBottom;
			varying vec2 vUv;
			void main() {
				// uv.y=1 at top edge (the horizon line), 0 at bottom (closer to camera)
				vec3 col = mix(uColorBottom, uColorTop, smoothstep(0.0, 1.0, vUv.y));
				float fadeTop = smoothstep(1.0, 0.92, vUv.y); // gentle feather at horizon edge
				gl_FragColor = vec4(col, uOpacity * (0.6 + 0.4 * fadeTop));
			}
		`
	});
	const horizon = new THREE.Mesh(horizonGeo, horizonMat);
	horizon.rotation.x = -Math.PI / 2.05; // nearly flat, slight tilt
	horizon.position.set(0, -2.6, -2);
	scene.add(horizon);

	// ---------- Poetry text lines ----------
	const lines: TextLine[] = POEM.map((text) =>
		createTextLine(text, { worldHeight: 0.42, fontSize: 96, italic: true })
	);
	for (const ln of lines) {
		ln.mesh.position.set(0, -0.9, 4.0); // anchor in front of camera
		scene.add(ln.mesh);
	}

	// ---------- State ----------
	const state = {
		t: 0,
		playing: false,
		raf: 0,
		lastWall: 0
	};
	const progressCallbacks: ((t: number) => void)[] = [];

	function applyTime(t: number) {
		state.t = Math.max(0, Math.min(DURATION, t));
		updateScene(state.t);
		for (const cb of progressCallbacks) cb(state.t);
	}

	function tick() {
		if (!state.playing) return;
		state.raf = requestAnimationFrame(tick);
		const now = performance.now();
		const dt = Math.min(0.05, (now - state.lastWall) / 1000);
		state.lastWall = now;
		let nt = state.t + dt;
		if (nt >= DURATION) {
			nt = DURATION;
			applyTime(nt);
			state.playing = false;
			return;
		}
		applyTime(nt);
	}

	function updateScene(t: number) {
		// ----- Camera -----
		// Slow zoom in during dance, then ease back to reveal horizon.
		const camIn = range(t, 0, 9, easeInOut); // 0 -> 1
		const camOut = range(t, 9, 14, easeInOut); // 0 -> 1
		camera.position.x = Math.sin(t * 0.18) * 0.25;
		camera.position.y = lerp(0, 0.35, camIn) - lerp(0, 0.7, camOut) + Math.sin(t * 0.21) * 0.05;
		camera.position.z = lerp(8, 5.4, camIn) + lerp(0, 4.2, camOut);
		// Look slightly above origin during dance, then tilt down toward horizon
		const lookY = lerp(0.1, 0.5, camIn) - lerp(0, 1.4, camOut);
		camera.lookAt(0, lookY, 0);

		// ----- Sky -----
		skyUniforms.uDawn.value = range(t, 9, 14, easeInOut);
		skyUniforms.uPulse.value = bell(t, 5, 8, 10.5, easeInOut);

		// ----- Particles -----
		particleUniforms.uTime.value = t;

		const attract = range(t, 3.5, 8, easeInOut); // drift -> sphere shell
		const explode = range(t, 10, 14, easeOutQuint); // sphere -> outward
		const fade = range(t, 13, 15, easeOut); // settle/fade out
		particleUniforms.uOpacity.value = lerp(
			lerp(0.55, 0.95, range(t, 0, 4, easeOut)),
			0.0,
			fade
		);
		particleUniforms.uGlow.value = lerp(0.4, 1.4, bell(t, 4, 8, 10.5, easeInOut));
		// Color shifts subtly: cool dust -> warm spark -> warm dawn embers
		const cool = new THREE.Color('#cfd6ff');
		const warm = new THREE.Color('#ffd9a8');
		const ember = new THREE.Color('#ffb070');
		const c = cool.clone();
		c.lerp(warm, range(t, 3, 7, easeInOut));
		c.lerp(ember, range(t, 10, 13, easeInOut));
		particleUniforms.uColor.value.copy(c);

		const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
		const arr = posAttr.array as Float32Array;
		const orbitAngle = (t > 6 ? (t - 6) * 0.45 : 0) * (1 - explode);
		const cosA = Math.cos(orbitAngle);
		const sinA = Math.sin(orbitAngle);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const ix = initialPos[i * 3 + 0];
			const iy = initialPos[i * 3 + 1];
			const iz = initialPos[i * 3 + 2];
			const tx = targetPos[i * 3 + 0];
			const ty = targetPos[i * 3 + 1];
			const tz = targetPos[i * 3 + 2];
			const ex = explodeDir[i * 3 + 0];
			const ey = explodeDir[i * 3 + 1];
			const ez = explodeDir[i * 3 + 2];
			const seed = seeds[i];

			// Drift around initial position
			const dx = ix + Math.sin(t * 0.32 + seed) * 0.45;
			const dy = iy + Math.cos(t * 0.38 + seed * 1.3) * 0.4;
			const dz = iz + Math.sin(t * 0.27 + seed * 0.7) * 0.3;

			// Orbit-rotated target (gentle swirl while condensed)
			const otx = tx * cosA - tz * sinA;
			const otz = tx * sinA + tz * cosA;
			const oty = ty + Math.sin(t * 0.9 + seed) * 0.05;

			// Drift -> target shell
			let px = lerp(dx, otx, attract);
			let py = lerp(dy, oty, attract);
			let pz = lerp(dz, otz, attract);

			// Explode outward (target + dir * distance), then mix in
			if (explode > 0) {
				const dist = explode * 9.5 + Math.sin(seed * 3.1) * 1.4;
				const epx = otx + ex * dist;
				const epy = oty + ey * dist - explode * explode * 1.8; // gentle gravity pull
				const epz = otz + ez * dist;
				px = lerp(px, epx, explode);
				py = lerp(py, epy, explode);
				pz = lerp(pz, epz, explode);
			}

			arr[i * 3 + 0] = px;
			arr[i * 3 + 1] = py;
			arr[i * 3 + 2] = pz;
		}
		posAttr.needsUpdate = true;

		// ----- Light core / Sun -----
		const ignite = range(t, 4, 6.5, easeOut);
		const dance = bell(t, 5.5, 8, 10, easeInOut);
		const rise = range(t, 10, 14, easeInOut);

		// Core position: at origin during dance, rises and slides forward as sun
		const cx = 0;
		const cy = lerp(0, 0.6, rise) - lerp(0, 0.35, range(t, 12, 15, easeOut)); // peak then settle
		const cz = lerp(0, 0.6, rise);
		core.position.set(cx, cy, cz);
		halo.position.copy(core.position);
		sunGlow.position.copy(core.position);

		const corePulse = 1 + dance * 0.25 * Math.sin(t * 7.0);
		const coreScale = lerp(0.0, 1.0, ignite) * (1 + rise * 0.4) * corePulse;
		core.scale.setScalar(coreScale);
		coreMat.opacity = ignite;

		const haloScale = lerp(0.6, 2.4, ignite) * (1 + dance * 0.4) * (1 + rise * 0.6);
		halo.scale.set(haloScale, haloScale, 1);
		haloMat.opacity = ignite * (0.6 + dance * 0.4) * (1 - range(t, 13.5, 15, easeIn));

		const sunScale = lerp(2.0, 8.5, rise);
		sunGlow.scale.set(sunScale, sunScale, 1);
		sunGlowMat.opacity = rise * 0.85 * (1 - range(t, 14.5, 15, easeIn));

		// ----- Horizon -----
		(horizonMat.uniforms.uOpacity as { value: number }).value = range(t, 9, 12, easeOut);

		// ----- Poetry -----
		// Each line uses a "bell" envelope for fade-in -> fade-out.
		// Window choices give each line ~3s on screen with overlapping breathing room.
		const lineEnvelopes = [
			bell(t, 0.6, 2.2, 4.2, easeInOut),
			bell(t, 4.6, 6.6, 9.0, easeInOut),
			bell(t, 10.6, 12.4, 14.6, easeInOut)
		];
		for (let i = 0; i < lines.length; i++) {
			const ln = lines[i];
			const a = lineEnvelopes[i];
			ln.material.opacity = a;
			// Subtle vertical drift so the line feels like it's breathing
			const drift = Math.sin(t * 0.6 + i * 1.7) * 0.025;
			// Place line in front of camera, locked to camera-space position.
			placeInCameraSpace(ln.mesh, camera, 0, -0.95 + drift, -3.4);
			// Slight scale punch on entry
			const s = lerp(0.96, 1.0, a);
			ln.mesh.scale.setScalar(s);
		}

		renderer.render(scene, camera);
	}

	// ---------- Public API ----------
	function play() {
		if (state.playing) return;
		if (state.t >= DURATION) state.t = 0;
		state.playing = true;
		state.lastWall = performance.now();
		state.raf = requestAnimationFrame(tick);
	}
	function pause() {
		state.playing = false;
		cancelAnimationFrame(state.raf);
	}
	function reset() {
		pause();
		applyTime(0);
	}
	function setTime(t: number) {
		applyTime(t);
	}
	function getTime() {
		return state.t;
	}
	function getDuration() {
		return DURATION;
	}
	function resize(w: number, h: number) {
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}
	function onProgress(cb: (t: number) => void) {
		progressCallbacks.push(cb);
	}
	function dispose() {
		pause();
		scene.traverse((obj) => {
			const m = obj as THREE.Mesh;
			if (m.isMesh && m.geometry) m.geometry.dispose();
			const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
			if (mat) {
				if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
				else mat.dispose();
			}
		});
		for (const ln of lines) ln.dispose();
		(haloMat.map as THREE.Texture | null)?.dispose();
		(sunGlowMat.map as THREE.Texture | null)?.dispose();
		renderer.dispose();
	}

	// Initial paint at t=0
	applyTime(0);

	return { play, pause, reset, setTime, getTime, getDuration, resize, dispose, onProgress };
}

// ---------- helpers ----------

function makeRadialTexture(): THREE.Texture {
	const size = 256;
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d')!;
	const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.25, 'rgba(255,230,190,0.55)');
	grad.addColorStop(0.55, 'rgba(255,180,120,0.18)');
	grad.addColorStop(1, 'rgba(255,180,120,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, size, size);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

// Position an object in the camera's local space at (x, y, z) so it stays
// pinned in the frame as the camera moves.
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
function placeInCameraSpace(
	obj: THREE.Object3D,
	cam: THREE.Camera,
	x: number,
	y: number,
	z: number
) {
	_v.set(x, y, z);
	cam.updateMatrixWorld();
	_v.applyMatrix4(cam.matrixWorld);
	obj.position.copy(_v);
	cam.getWorldQuaternion(_q);
	obj.quaternion.copy(_q);
}
