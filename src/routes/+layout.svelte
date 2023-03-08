<script lang="ts">
	// import '@skeletonlabs/skeleton/themes/theme-rocket.css';
	import '../theme.postcss';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';
	import '../chessground.css';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	import { AppShell, Drawer, drawerStore, Modal, Toast } from "@skeletonlabs/skeleton";
	import Header from '$lib/components/layout/Header.svelte';
	import SideBarLeft from '$lib/components/layout/SideBarLeft.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
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
<Modal />

<AppShell>
	<svelte:fragment slot="header"><Header /></svelte:fragment>
	<div class="base-page-container"><slot /></div>
	<svelte:fragment slot="pageFooter"><Footer /></svelte:fragment>
</AppShell>
