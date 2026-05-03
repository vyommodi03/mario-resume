import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? '/mario-resume/' : '/',
    // Note: Assets have been moved to the root for GitHub Pages compatibility.
    // If you run 'npm run build', ensure the 'assets' folder is copied to 'dist'.
  }
})
