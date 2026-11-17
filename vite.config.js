import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Temporarily keep names and source locations readable so a production
    // Temporal Dead Zone error can be traced to its original module binding.
    minify: false,
    sourcemap: true
  }
})
