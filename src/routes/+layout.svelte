<script>
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { AppShell } from "@skeletonlabs/skeleton";
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<AppShell>
	<svelte:fragment slot="header"><Header /></svelte:fragment>
	<div class="base-page-container"><slot /></div>
	<svelte:fragment slot="pageFooter"><Footer /></svelte:fragment>
</AppShell>
