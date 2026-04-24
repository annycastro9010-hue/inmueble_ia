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

// Resizes and pre-processes each image into a fixed 720x1280 JPEG using Canvas
async function processImageForVideo(url: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const OUT_W = 720;
      const OUT_H = 1280;

      const canvas = document.createElement('canvas');
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext('2d')!;

      // --- BLURRED BACKGROUND ---
      // Scale image to cover full 720x1280
      const coverScale = Math.max(OUT_W / img.width, OUT_H / img.height);
      const bgW = img.width * coverScale;
      const bgH = img.height * coverScale;
      const bgX = (OUT_W - bgW) / 2;
      const bgY = (OUT_H - bgH) / 2;

      ctx.filter = 'blur(18px) brightness(0.5)';
      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.filter = 'none';

      // --- FOREGROUND: maintain aspect ratio, centered ---
      // Height = 560px so wide panoramic images show wide and rooms look spacious
      const FG_H = 560;
      const fgScale = FG_H / img.height;
      const fgW = img.width * fgScale;
      const fgX = (OUT_W - fgW) / 2;
      const fgY = (OUT_H - FG_H) / 2;

      ctx.drawImage(img, fgX, fgY, fgW, FG_H);

      canvas.toBlob(blob => {
        if (!blob) return reject('Blob failed');
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject('Image load failed: ' + url);
    img.src = url;
  });
}

export async function generatePropertyVideo(assets: PropertyVideoAssets): Promise<Blob> {
  console.log('🎬 Iniciando generación de video...');
  const ff = await loadFFmpeg();

  const numImgs = assets.imageUrls.length;
  const totalDuration = Math.min(numImgs * 3, 30); // max 30s
  const durationPerImg = totalDuration / numImgs;

  // 1. Pre-process images on Canvas: apply blur bg + centered fg — NO complex FFmpeg filters needed
  for (let i = 0; i < numImgs; i++) {
    console.log(`🖼️ Procesando imagen ${i + 1}/${numImgs}...`);
    const data = await processImageForVideo(assets.imageUrls[i]);
    await ff.writeFile(`img${i}.jpg`, data);
  }

  // 2. Build simple FFmpeg command — just concat pre-processed images
  const command: string[] = [];

  for (let i = 0; i < numImgs; i++) {
    command.push('-loop', '1', '-t', durationPerImg.toFixed(2), '-i', `img${i}.jpg`);
  }

  // Simple concat filter — images are already 720x1280 from canvas
  let filterComplex = '';
  for (let i = 0; i < numImgs; i++) {
    // Add slow zoom to each image
    const frames = Math.round(durationPerImg * 25);
    filterComplex += `[${i}:v]zoompan=z='min(zoom+0.0004,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=720x1280:fps=25[v${i}];`;
  }

  let concatInputs = '';
  for (let i = 0; i < numImgs; i++) concatInputs += `[v${i}]`;
  filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[vout]`;

  command.push(
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '26',
    '-r', '25',
    'output.mp4'
  );

  console.log('⚙️ Ejecutando FFmpeg...');
  const result = await ff.exec(command);
  if (result !== 0) {
    // Retry without zoompan (simpler fallback)
    console.warn('zoompan falló, intentando con concat simple...');
    return generateSimpleVideo(ff, numImgs, durationPerImg, assets.title);
  }

  const data = await ff.readFile('output.mp4');
  console.log('✅ Video generado!');
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array((data as unknown as ArrayBuffer));
  return new Blob([uint8], { type: 'video/mp4' });
}

async function generateSimpleVideo(ff: FFmpeg, numImgs: number, durationPerImg: number, title: string): Promise<Blob> {
  const command: string[] = [];
  for (let i = 0; i < numImgs; i++) {
    command.push('-loop', '1', '-t', durationPerImg.toFixed(2), '-i', `img${i}.jpg`);
  }

  let filterComplex = '';
  let concatInputs = '';
  for (let i = 0; i < numImgs; i++) {
    filterComplex += `[${i}:v]scale=720:1280:force_original_aspect_ratio=disable,setsar=1[v${i}];`;
    concatInputs += `[v${i}]`;
  }
  filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[vout]`;

  command.push(
    '-filter_complex', filterComplex,
    '-map', '[vout]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-r', '25',
    'output_simple.mp4'
  );

  const result = await ff.exec(command);
  if (result !== 0) throw new Error(`FFmpeg error en fallback: ${result}`);

  const data = await ff.readFile('output_simple.mp4');
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array((data as unknown as ArrayBuffer));
  return new Blob([uint8], { type: 'video/mp4' });
}
