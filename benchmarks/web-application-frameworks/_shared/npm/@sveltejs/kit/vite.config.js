// SvelteKit with adapter-node, as its deployment guide says to run on Node.
// SvelteKit 3 takes its configuration here, through the sveltekit() plugin.
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-node'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [sveltekit({ adapter: adapter() })] })
