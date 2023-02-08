<script lang ="ts">
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { AppShell, Toast } from "@skeletonlabs/skeleton";
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	// SUPABASE AUTH SESSION OBSERVER
	onMount(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => invalidate('supabase:auth'));
		return () => subscription.unsubscribe();
	});
</script>

<Toast />

<AppShell>
	<svelte:fragment slot="header"><Header /></svelte:fragment>
	<div class="base-page-container"><slot /></div>
	<svelte:fragment slot="pageFooter"><Footer /></svelte:fragment>
</AppShell>
