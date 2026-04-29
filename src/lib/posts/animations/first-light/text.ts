import * as THREE from 'three';

// Render a line of poetry to a high-DPI canvas, then wrap it on a plane mesh.
// Returns the mesh plus an `setOpacity` helper. The plane preserves the canvas aspect.

export type TextLine = {
	mesh: THREE.Mesh;
	material: THREE.MeshBasicMaterial;
	width: number;
	height: number;
	dispose: () => void;
};

export function createTextLine(
	text: string,
	options: {
		worldHeight?: number;
		fontSize?: number;
		font?: string;
		color?: string;
		italic?: boolean;
		letterSpacing?: number;
	} = {}
): TextLine {
	const fontSize = options.fontSize ?? 96;
	const worldHeight = options.worldHeight ?? 0.6;
	const font = options.font ?? "'Cormorant Garamond', 'Garamond', 'Georgia', serif";
	const color = options.color ?? '#f4ecd8';
	const italic = options.italic ?? true;
	const letterSpacing = options.letterSpacing ?? 0.04;

	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const measure = document.createElement('canvas');
	const mctx = measure.getContext('2d')!;
	const fontStr = `${italic ? 'italic ' : ''}300 ${fontSize}px ${font}`;
	mctx.font = fontStr;
	const baseWidth = mctx.measureText(text).width;
	// Add tracking visually by inserting half-spaces; cheap approximation.
	const trackingPx = letterSpacing * fontSize * (text.length - 1);
	const padding = fontSize * 0.6;
	const widthPx = Math.ceil(baseWidth + trackingPx + padding * 2);
	const heightPx = Math.ceil(fontSize * 1.6 + padding);

	const canvas = document.createElement('canvas');
	canvas.width = Math.ceil(widthPx * dpr);
	canvas.height = Math.ceil(heightPx * dpr);
	const ctx = canvas.getContext('2d')!;
	ctx.scale(dpr, dpr);
	ctx.font = fontStr;
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';
	ctx.fillStyle = color;
	// Soft glow underneath, layered draws for halo effect.
	ctx.shadowColor = 'rgba(255, 220, 180, 0.55)';
	ctx.shadowBlur = fontSize * 0.6;

	let x = padding;
	const y = heightPx / 2;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		ctx.fillText(ch, x, y);
		x += ctx.measureText(ch).width + letterSpacing * fontSize;
	}

	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 8;
	tex.minFilter = THREE.LinearMipmapLinearFilter;
	tex.magFilter = THREE.LinearFilter;
	tex.needsUpdate = true;

	const aspect = widthPx / heightPx;
	const h = worldHeight;
	const w = h * aspect;
	const geo = new THREE.PlaneGeometry(w, h);
	const mat = new THREE.MeshBasicMaterial({
		map: tex,
		transparent: true,
		opacity: 0,
		depthWrite: false,
		blending: THREE.NormalBlending
	});
	const mesh = new THREE.Mesh(geo, mat);

	return {
		mesh,
		material: mat,
		width: w,
		height: h,
		dispose: () => {
			geo.dispose();
			mat.dispose();
			tex.dispose();
		}
	};
}
