<script lang="ts">
	import { onMount } from 'svelte';
	import { openLogin } from './login-state';

	const HOLD_MS = 1000; // 3-finger hold duration
	const CLICK_WINDOW_MS = 1500; // 5 logo clicks within this window
	const CLICK_TARGET = 5;

	let touchHoldTimer: ReturnType<typeof setTimeout> | null = null;

	function isCmdJ(e: KeyboardEvent) {
		// Cmd+J on macOS, Ctrl+J on others — ignored if focused in an input
		const inField =
			document.activeElement &&
			['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
		if (inField) return false;
		return (e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J');
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!isCmdJ(e)) return;
		e.preventDefault();
		openLogin();
	}

	function onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 3) return;
		clearTouchTimer();
		touchHoldTimer = setTimeout(() => {
			openLogin();
			touchHoldTimer = null;
		}, HOLD_MS);
	}

	function clearTouchTimer() {
		if (touchHoldTimer) {
			clearTimeout(touchHoldTimer);
			touchHoldTimer = null;
		}
	}

	// Logo-click fallback: 5 clicks within CLICK_WINDOW_MS on any element with [data-secret-login]
	let clickTimes: number[] = [];
	function onClickCapture(e: MouseEvent) {
		const target = e.target as HTMLElement | null;
		if (!target) return;
		const hit = target.closest('[data-secret-login]');
		if (!hit) return;
		const now = performance.now();
		clickTimes = clickTimes.filter((t) => now - t < CLICK_WINDOW_MS);
		clickTimes.push(now);
		if (clickTimes.length >= CLICK_TARGET) {
			clickTimes = [];
			openLogin();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchend', clearTouchTimer);
		window.addEventListener('touchcancel', clearTouchTimer);
		window.addEventListener('touchmove', clearTouchTimer);
		document.addEventListener('click', onClickCapture, true);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchend', clearTouchTimer);
			window.removeEventListener('touchcancel', clearTouchTimer);
			window.removeEventListener('touchmove', clearTouchTimer);
			document.removeEventListener('click', onClickCapture, true);
		};
	});
</script>
