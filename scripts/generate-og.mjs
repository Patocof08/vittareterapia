/**
 * Genera public/og-image.png (1200×630) para las meta tags OG.
 * Uso: node scripts/generate-og.mjs
 * Requiere: npm install --save-dev sharp
 */
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#145A7A"/>
      <stop offset="100%" stop-color="#2A90C0"/>
    </linearGradient>
  </defs>

  <!-- Fondo degradado -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Círculos decorativos sutiles -->
  <circle cx="1080" cy="100" r="220" fill="white" fill-opacity="0.04"/>
  <circle cx="1120" cy="540" r="160" fill="white" fill-opacity="0.04"/>
  <circle cx="40"   cy="560" r="120" fill="white" fill-opacity="0.03"/>

  <!-- Logo: cuadro redondeado blanco semitransparente -->
  <rect x="100" y="137" width="85" height="85" rx="16" fill="white" fill-opacity="0.18"/>
  <!-- Letra V dentro del cuadro -->
  <text x="142" y="204"
        font-family="Arial, Helvetica, sans-serif"
        font-size="54"
        font-weight="bold"
        fill="white"
        text-anchor="middle">V</text>

  <!-- Nombre de marca -->
  <text x="100" y="307"
        font-family="Arial, Helvetica, sans-serif"
        font-size="80"
        font-weight="bold"
        fill="white">Vittare</text>

  <!-- Título principal -->
  <text x="100" y="367"
        font-family="Arial, Helvetica, sans-serif"
        font-size="38"
        fill="white"
        fill-opacity="0.93">Terapia en l&#237;nea segura y sencilla</text>

  <!-- Subtítulo secundario -->
  <text x="100" y="413"
        font-family="Arial, Helvetica, sans-serif"
        font-size="26"
        fill="white"
        fill-opacity="0.70">Conecta con terapeutas profesionales certificados</text>

  <!-- Línea separadora -->
  <line x1="100" y1="455" x2="1100" y2="455"
        stroke="white" stroke-opacity="0.25" stroke-width="1.5"/>

  <!-- Dominio -->
  <text x="100" y="495"
        font-family="Arial, Helvetica, sans-serif"
        font-size="24"
        fill="white"
        fill-opacity="0.65">vittareterapia.com</text>
</svg>`;

const outPath = resolve(__dirname, '../public/og-image.png');

await sharp(Buffer.from(svg, 'utf8'))
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log('✓ public/og-image.png generado (1200×630)');
