<script>
	import '../app.css';
	import { PUBLIC_FATHOM_ID, PUBLIC_FATHOM_URL } from '$env/static/public';
	import * as Fathom from 'fathom-client';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { navigating, page } from '$app/stores';

	if (PUBLIC_FATHOM_ID !== 'DEV') {
		onMount(async () => {
			Fathom.load(PUBLIC_FATHOM_ID, {
				url: PUBLIC_FATHOM_URL
			});
		});
	}

	// track a page view when the pathname changes
	$: $page.url.pathname, browser && Fathom.trackPageview();
</script>

<slot />
