import type { Component } from 'svelte';
import JdLogo from './JdLogo.svelte';
import FirstLight from './first-light/FirstLight.svelte';

type AnimationProps = { autoplay?: boolean };

export const animations: Record<string, Component<AnimationProps>> = {
	'jd-logo': JdLogo,
	'first-light': FirstLight
};

export function getAnimation(key: string | undefined | null) {
	if (!key) return null;
	return animations[key] ?? null;
}
