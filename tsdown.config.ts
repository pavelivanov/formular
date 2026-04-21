import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: [ 'src/index.ts' ],
  exports: false,
  format: [ 'esm', 'cjs' ],
  minify: false,
  outDir: 'dist',
  platform: 'neutral',
  sourcemap: true,
  target: 'es2019',
  treeshake: true,
})
