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
  console.log("Iniciando generación de video...", assets);
  const ff = await loadFFmpeg();
  
  try {
    // 1. Write images to virtual FS
    for (let i = 0; i < assets.imageUrls.length; i++) {
      console.log(`Descargando imagen ${i}...`);
      const data = await fetchFile(assets.imageUrls[i]);
      await ff.writeFile(`img${i}.jpg`, data);
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
      const zoomExpr = `zoom+0.002`;
      // Simplificando zoompan y asegurando formato vertical
      filterComplex += `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(durationPerImg * 25)}:s=1080x1920,setsar=1[v${i}];`;
    }

    // Concatenation
    let concatInputs = '';
    for (let i = 0; i < numImgs; i++) concatInputs += `[v${i}]`;
    filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[v_base];`;

    // Viral Subtitles (Escaping single quotes for safety)
    const cleanTitle = assets.title.toUpperCase().replace(/'/g, "");
    const cleanPrice = assets.price.toUpperCase().replace(/'/g, "");
    
    // Eliminamos 'fontfile' porque causa error si no existe físicamente en el FS virtual
    filterComplex += `[v_base]drawtext=text='${cleanTitle}':fontcolor=yellow:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2-100:borderw=5:bordercolor=black,`;
    filterComplex += `drawtext=text='${cleanPrice}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2+50:borderw=3:bordercolor=black[v_final]`;

    command.push(
      '-filter_complex', filterComplex,
      '-map', '[v_final]',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-r', '25',
      'output.mp4'
    );

    console.log("Ejecutando FFmpeg...");
    const result = await ff.exec(command);
    
    if (result !== 0) {
      throw new Error(`FFmpeg falló con código ${result}. Revisa los logs de la consola.`);
    }
    
    const data = await ff.readFile('output.mp4');
    console.log("Video generado con éxito.");
    return new Blob([(data as any).buffer], { type: 'video/mp4' });
  } catch (err: any) {
    console.error("Error en generatePropertyVideo:", err);
    throw new Error(err.message || "Error desconocido al procesar el video");
  }
}
