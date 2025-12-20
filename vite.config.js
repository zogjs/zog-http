import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',
    
    // Use Terser for maximum compression
    minify: 'terser',
    
    // Terser settings for aggressive compression
    terserOptions: {
      compress: {
        // Remove all console.* statements in production
        drop_console: true,
        // Remove all debugger statements
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
        // Optimize comparisons
        comparisons: true,
        // Evaluate constant expressions
        evaluate: true,
        // Inline functions
        inline: true,
        // Join consecutive var statements
        join_vars: true,
        // Optimize loops
        loops: true,
        // Drop unreachable code
        unused: true,
      },
      format: {
        // Remove all comments from output
        comments: false,
      },
      // Mangle variable and function names for smaller size
      mangle: {
        // Keep class names readable (optional)
        keep_classnames: false,
        // Keep function names readable (optional)
        keep_fnames: false,
      },
    },
    
    // Library mode settings
    lib: {
      entry: resolve(__dirname, 'src/zog-kit.js'),
      name: 'ZogKit',
      formats: ['es', 'umd'],
      fileName: (format) => `zog-kit.${format}.js`
    },
    
    // Optimize chunk size
    rollupOptions: {
      // Externalize dependencies (Zog.js should be provided by the user)
      external: [],
      output: {
        // Global variables for UMD build
        globals: {},
        // Preserve exports
        exports: 'named',
      }
    },
    
    // Generate sourcemaps for debugging
    sourcemap: true,
    
    // Target modern browsers
    target: 'es2017',
    
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
  },
  
  // Development server settings
  server: {
    port: 3000,
    open: true,
  },
});