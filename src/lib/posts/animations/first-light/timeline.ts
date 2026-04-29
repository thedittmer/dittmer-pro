// Tiny time helpers for orchestrating a fixed-duration short.
// All inputs are in seconds.

export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);
export const linear = (x: number) => x;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Returns 0..1 progress as t moves through [start, end].
// Outside the window: 0 before, 1 after. Optional easing applied to the 0..1 progress.
export function range(t: number, start: number, end: number, ease: (x: number) => number = linear) {
	if (end <= start) return t >= end ? 1 : 0;
	return ease(clamp01((t - start) / (end - start)));
}

// Triangular envelope: rises in [start, peak], falls in [peak, end]. 0..1.
// Useful for "fade in, hold briefly, fade out" of a single line of text.
export function bell(
	t: number,
	start: number,
	peak: number,
	end: number,
	ease: (x: number) => number = easeInOut
) {
	if (t <= start || t >= end) return 0;
	if (t < peak) return ease(clamp01((t - start) / (peak - start)));
	return ease(clamp01(1 - (t - peak) / (end - peak)));
}

// Trapezoidal envelope: fade in, hold at 1, fade out. 0..1.
export function envelope(
	t: number,
	fadeInStart: number,
	holdStart: number,
	holdEnd: number,
	fadeOutEnd: number,
	ease: (x: number) => number = easeInOut
) {
	if (t <= fadeInStart || t >= fadeOutEnd) return 0;
	if (t < holdStart) return ease(clamp01((t - fadeInStart) / (holdStart - fadeInStart)));
	if (t <= holdEnd) return 1;
	return ease(clamp01(1 - (t - holdEnd) / (fadeOutEnd - holdEnd)));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
