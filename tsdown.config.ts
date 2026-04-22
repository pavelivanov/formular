import { defineConfig } from 'tsdown'

// Two independent build passes rather than a single multi-entry build —
// otherwise rolldown hoists shared modules into a chunk that every entry
// has to load, inflating the main bundle for consumers that don't use
// `formular/devtools`. With separate passes each entry is self-contained;
// the cost is some code duplication in the devtools bundle, which is the
// right tradeoff for an opt-in subpath.
export default defineConfig([
  {
    name: 'main',
    entry: [ 'src/index.ts' ],
    outDir: 'dist',
    format: [ 'esm', 'cjs' ],
    dts: true,
    sourcemap: true,
    platform: 'neutral',
    target: 'es2019',
    treeshake: true,
    clean: true,
    exports: false,
  },
  {
    name: 'devtools',
    entry: [ 'src/devtools/index.ts' ],
    outDir: 'dist/devtools',
    format: [ 'esm', 'cjs' ],
    dts: true,
    sourcemap: true,
    platform: 'neutral',
    target: 'es2019',
    treeshake: true,
    clean: false, // first pass already cleaned
    exports: false,
  },
  {
    name: 'testing',
    entry: [ 'src/testing/index.ts' ],
    outDir: 'dist/testing',
    format: [ 'esm', 'cjs' ],
    dts: true,
    sourcemap: true,
    platform: 'neutral',
    target: 'es2019',
    treeshake: true,
    clean: false,
    exports: false,
  },
])
