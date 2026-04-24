import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => console.log('FFMPEG:', message));
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

export interface PropertyVideoAssets {
  imageUrls: string[];
  title: string;
  price: string;
}

const OUT_W = 720;
const OUT_H = 1280;
const SECS_PER_IMAGE = 3; // 3 seconds per image, max 30s total

/**
 * Pre-processes each image using Canvas:
 * - Blurred background filling the full 720x1280 frame
 * - Foreground image centered, maintaining aspect ratio, NOT stretched
 * This handles both landscape-panoramic and portrait-panoramic photos correctly.
 */
async function renderFrameToJpeg(url: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext('2d')!;

      // --- BLURRED BACKGROUND: scale to cover full frame ---
      const coverScale = Math.max(OUT_W / img.width, OUT_H / img.height);
      const bgW = img.width * coverScale;
      const bgH = img.height * coverScale;
      const bgX = (OUT_W - bgW) / 2;
      const bgY = (OUT_H - bgH) / 2;
      ctx.filter = 'blur(22px) brightness(0.45) saturate(1.2)';
      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.filter = 'none';

      // --- FOREGROUND: fit inside frame, maintain aspect ratio ---
      // For portrait images: fit by height. For landscape: fit by width.
      const isPortrait = img.height > img.width;
      let fgW: number, fgH: number;

      if (isPortrait) {
        // Portrait photo: limit height to 95% of frame height
        fgH = OUT_H * 0.95;
        fgW = (img.width / img.height) * fgH;
        // But don't exceed frame width
        if (fgW > OUT_W * 0.95) {
          fgW = OUT_W * 0.95;
          fgH = (img.height / img.width) * fgW;
        }
      } else {
        // Landscape/panoramic: limit to 90% of frame width
        fgW = OUT_W * 0.90;
        fgH = (img.height / img.width) * fgW;
        // Don't exceed frame height
        if (fgH > OUT_H * 0.85) {
          fgH = OUT_H * 0.85;
          fgW = (img.width / img.height) * fgH;
        }
      }

      const fgX = (OUT_W - fgW) / 2;
      const fgY = (OUT_H - fgH) / 2;

      // Subtle shadow behind foreground image
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 40;
      ctx.drawImage(img, fgX, fgY, fgW, fgH);
      ctx.shadowBlur = 0;

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject('Canvas toBlob failed');
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        },
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => reject('Failed to load: ' + url);
    img.src = url;
  });
}

export async function generatePropertyVideo(assets: PropertyVideoAssets): Promise<Blob> {
  console.log('🎬 Iniciando generación de video...');
  const ff = await loadFFmpeg();

  const numImgs = Math.min(assets.imageUrls.length, 10); // max 10 images = 30s
  const durationPerImg = SECS_PER_IMAGE;
  const totalDuration = numImgs * durationPerImg; // max 30s

  console.log(`📸 Procesando ${numImgs} imágenes → ${totalDuration}s de video`);

  // Step 1: Render each image to JPEG via Canvas (blur + centered fg)
  for (let i = 0; i < numImgs; i++) {
    console.log(`🖼️ Renderizando frame ${i + 1}/${numImgs}...`);
    const data = await renderFrameToJpeg(assets.imageUrls[i]);
    await ff.writeFile(`img${i}.jpg`, data);
  }

  // Step 2: Build FFmpeg command — NO zoompan, NO complex filters
  // Images are already 720x1280 from Canvas. FFmpeg just loops + encodes.
  const command: string[] = [];
  for (let i = 0; i < numImgs; i++) {
    command.push('-loop', '1', '-t', String(durationPerImg), '-i', `img${i}.jpg`);
  }

  // Simple concat filter — images already correct size, just set SAR and concat
  let filter = '';
  for (let i = 0; i < numImgs; i++) {
    filter += `[${i}:v]setsar=1[v${i}];`;
  }
  let inputs = '';
  for (let i = 0; i < numImgs; i++) inputs += `[v${i}]`;
  filter += `${inputs}concat=n=${numImgs}:v=1:a=0[vout]`;

  command.push(
    '-filter_complex', filter,
    '-map', '[vout]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '30',
    '-r', '24',
    '-t', String(totalDuration),
    'output.mp4'
  );

  console.log('⚙️ Codificando video...');
  const result = await ff.exec(command);

  if (result !== 0) throw new Error(`FFmpeg falló con código ${result}`);

  const data = await ff.readFile('output.mp4');
  console.log('✅ Video listo!');
  return new Blob([data as BlobPart], { type: 'video/mp4' });
}
