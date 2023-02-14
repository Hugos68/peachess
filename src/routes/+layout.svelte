<script lang ="ts">
	import '../theme.postcss';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { AppShell, Drawer, drawerStore, Modal, Toast } from "@skeletonlabs/skeleton";
	import Header from '$lib/components/Header.svelte';
	import SideBarLeft from '$lib/components/SideBarLeft.svelte';
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
<Drawer>
	{#if $drawerStore.id==='sideBarLeft'}
		<SideBarLeft />
	{/if}
</Drawer>

<AppShell>
	<svelte:fragment slot="header">
		<div class="2xl:hidden">
			<Header />
		</div>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<div class="hidden 2xl:block">
			<SideBarLeft />
		</div>
	</svelte:fragment>
	<div class="base-page-container"><slot /></div>
	<svelte:fragment slot="pageFooter"><Footer /></svelte:fragment>
</AppShell>
