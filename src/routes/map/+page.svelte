<svelte:head>
	<title>Neosho Sale Map</title>
</svelte:head>

<section class="map">
	<iframe title="Neosho Sale Map" src="https://www.neosho.sale/embed/map" allowfullscreen></iframe>
</section>

<style>
	.map {
		position: fixed;
		inset: 4rem 0 0 0;
	}
	iframe {
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
