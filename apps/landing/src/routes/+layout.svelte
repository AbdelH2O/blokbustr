<script lang="ts">
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { dev } from '$app/environment';
	import Navbar from '$lib/components/navbar.svelte';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	let { children } = $props();

	injectAnalytics({
		mode: dev ? 'development' : 'production'
	});
</script>

<Toaster
	position="bottom-center"
	richColors
	toastOptions={{
		unstyled: true,
		class: 'bg-primary text-background',
		// style: "background: #0A192F; border-radius: 0; padding: 10px; font-size: 16px; color: #00FF99",
	}}
/>
<svelte:head>
	<script data-client-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTYxZjhiZS04MTM4LTQwNGQtOTE3Ny1hMjcxN2I3MTUyMTgiLCJ0b2tlbiI6IjYwN2FmYjczLWY1ZTEtNGFiZi1hYjY5LWI0MjFiY2Q3NzJkNiIsImhvc3QiOiJ3d3cuYmxva2J1c3RyLmNvbSJ9.otIlkP5XPjWhiTEWXa3cvxLHhpEDxvoFGkVUMf6QavU" src="https://cdn.transduce.ai/js/sdk.js"></script>
</svelte:head>
<div
	class="bg-background flex h-screen w-screen flex-col"
	style="background: linear-gradient(90deg, #0A192F 21.7px, transparent 1%) center, linear-gradient(#0A192F 21.7px, transparent 1%) center, #00FF99C0; background-size: 22.0px 22.0px"
>
	<Navbar />
	{@render children()}
</div>
