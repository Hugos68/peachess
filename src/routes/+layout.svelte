<script lang="ts">
	// import '../theme.postcss';
	import '@skeletonlabs/skeleton/themes/theme-modern.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';
	import '../chessground.css';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	import { AppShell, Drawer, drawerStore, Modal, Toast } from "@skeletonlabs/skeleton";
	import Header from '$lib/components/layout/Header.svelte';
	import SideBarLeft from '$lib/components/layout/SideBarLeft.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { page } from '$app/stores';

	// SUPABASE AUTH SESSION OBSERVER
	onMount(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => invalidate('supabase:auth'));
		return () => subscription.unsubscribe();
	});

	const triggerNewGameNotificationToast = (chessGame: OnlineChessGame) => {
		const t: ToastSettings = {
            message: 'Somebody challenged you in a game!',
            background: 'success',
            autohide: true,
			action: {
				label: 'Go to game',
				response: async () => await goto(`/games/${chessGame.id}`)
			}
        }
        toastStore.trigger(t);

	}

	$: if ($page.data.session) {
		supabase
		.channel('table-db-changes')
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'games',
				filter: `player_id_white=eq.${$page.data.session.user.id}`
			},
			(payload) => {
				const newChessGame: OnlineChessGame = payload.new as OnlineChessGame
				triggerNewGameNotificationToast(newChessGame);
			}
		)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'games',
				filter: `player_id_black=eq.${$page.data.session.user.id}`
			},
			(payload) => {
				const newChessGame: OnlineChessGame = payload.new as OnlineChessGame
				triggerNewGameNotificationToast(newChessGame);
			}
		)
		.subscribe();
	}
</script>

<Toast />
<Drawer>
	{#if $drawerStore.id==='sideBarLeft'}
		<SideBarLeft />
	{/if}
</Drawer>
<Modal />

<AppShell>
	<svelte:fragment slot="header">
		<div class="2xl:hidden">
			<Header />
		</div>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		{#if $page.route.id!=='/'}
			<div class="hidden 2xl:block">
				<SideBarLeft />
			</div>
		{/if}
	</svelte:fragment>
	<div class="base-page-container"><slot /></div>
	<svelte:fragment slot="pageFooter"><Footer /></svelte:fragment>
</AppShell>
