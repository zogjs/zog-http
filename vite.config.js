import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        unused: true,
      },
      format: {
        comments: false,
      },
      mangle: true,
    },
    lib: {
      entry: resolve(__dirname, 'src/zog-http.js'),
      name: 'ZogHttp',
      formats: ['es'],
      fileName: () => 'zog-http.es.js'  
    },
    rollupOptions: {
      external: ['zogjs'], 
      output: {
        exports: 'named',
      }
    },
    sourcemap: false, 
    target: 'es2017',
  },
  server: {
    port: 3000,
    open: true,
  },
});