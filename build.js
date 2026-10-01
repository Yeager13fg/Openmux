// ============================================================
//  Build Script - Compila TypeScript para JS com esbuild
//  Gera dist/cli.js pronto para rodar no Termux
// ============================================================

import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outfile: 'dist/cli.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Mantém pacotes npm como externos (instalados via npm install)
  packages: 'external',
  // Minificação leve para reduzir tamanho no celular
  minifySyntax: true,
  // Sourcemap desabilitado para produção
  sourcemap: false,
});

console.log('✅ Build concluído: dist/cli.js');
