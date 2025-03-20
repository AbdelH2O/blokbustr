<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
import '../app.css';
	let { children } = $props();
</script>
<div class="bg-background h-screen w-screen flex flex-col" style="background: linear-gradient(90deg, #0A192F 21.7px, transparent 1%) center, linear-gradient(#0A192F 21.7px, transparent 1%) center, #00FF99C0; background-size: 22.0px 22.0px">
	<Navbar />
	{@render children()}
</div>
