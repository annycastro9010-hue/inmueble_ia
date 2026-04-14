import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
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

export async function generatePropertyVideo(assets: PropertyVideoAssets): Promise<Blob> {
  const ff = await loadFFmpeg();
  
  // 1. Write images to virtual FS
  for (let i = 0; i < assets.imageUrls.length; i++) {
    await ff.writeFile(`img${i}.jpg`, await fetchFile(assets.imageUrls[i]));
  }

  const numImgs = assets.imageUrls.length;
  const totalDuration = 15; // Viral 15-sec teaser
  const durationPerImg = totalDuration / numImgs;

  const command: string[] = [];

  // Inputs
  for (let i = 0; i < numImgs; i++) {
    command.push('-loop', '1', '-t', durationPerImg.toFixed(2), '-i', `img${i}.jpg`);
  }

  // Filter Complex for Hormozi Style
  let filterComplex = '';
  
  for (let i = 0; i < numImgs; i++) {
    // Zoom Expression: slow zoom in
    const zoomExpr = `zoom+0.002`;
    // Scale and Crop for 9:16 (1080x1920)
    filterComplex += `[${i}:v]scale=2560:-1,zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(durationPerImg * 25)}:s=1080x1920,setsar=1[v${i}];`;
  }

  // Concatenation
  let concatInputs = '';
  for (let i = 0; i < numImgs; i++) concatInputs += `[v${i}]`;
  filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[v_base];`;

  // Viral Subtitles (Bold Yellow, centered)
  const cleanTitle = assets.title.toUpperCase();
  const cleanPrice = assets.price.toUpperCase();
  
  filterComplex += `[v_base]drawtext=text='${cleanTitle}':fontcolor=yellow:fontsize=100:fontfile='Manrope-Bold.ttf':x=(w-text_w)/2:y=(h-text_h)/2-100:borderw=10:bordercolor=black,`;
  filterComplex += `drawtext=text='${cleanPrice}':fontcolor=white:fontsize=80:fontfile='Manrope-Bold.ttf':x=(w-text_w)/2:y=(h-text_h)/2+50:borderw=5:bordercolor=black[v_final]`;

  command.push(
    '-filter_complex', filterComplex,
    '-map', '[v_final]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '28',
    'output.mp4'
  );

  // Note: We need to handle font files or use default font
  // For now we'll assume default or simplify drawtext if font isn't loaded
  
  await ff.exec(command);
  
  const data = await ff.readFile('output.mp4');
  return new Blob([(data as any).buffer], { type: 'video/mp4' });
}
