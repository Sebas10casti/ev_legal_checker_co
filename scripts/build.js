/**
 * @fileoverview Script de empaquetado estático para GitHub Pages (carpeta dist/).
 * Copia los activos con rutas relativas y crea el archivo .nojekyll.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(resolve(rootDir, 'index.html'), resolve(distDir, 'index.html'));
cpSync(resolve(rootDir, 'styles'), resolve(distDir, 'styles'), { recursive: true });
cpSync(resolve(rootDir, 'src'), resolve(distDir, 'src'), {
  recursive: true,
  filter: (srcPath) => !srcPath.endsWith('.test.js'),
});

// Evita que Jekyll procese archivos en GitHub Pages
writeFileSync(resolve(distDir, '.nojekyll'), '');

console.log('✔ Build estático generado exitosamente en ./dist listo para GitHub Pages.');
