import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  console.log("Cargando FFmpeg WASM desde CDN...");
  try {
    ffmpeg = new FFmpeg();
    
    // Configuramos el logger para ver la salida real de FFmpeg en la consola
    ffmpeg.on('log', ({ message }) => {
      console.log("FFMPEG_LOG:", message);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    console.log("FFmpeg cargado correctamente.");
    return ffmpeg;
  } catch (error) {
    console.error("Falla crítica al cargar FFmpeg:", error);
    throw new Error("No se pudo cargar el motor FFmpeg. Verifica tu conexión a internet.");
  }
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

    // 2. Descargar fuente para drawtext (Usando CDN con CORS permitido)
    console.log("Descargando fuente Inter-Bold.ttf via CDN...");
    let hasFont = false;
    try {
      // Usamos fetch directamente para validar la respuesta antes de pasarla a FFmpeg
      const response = await fetch('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/static/Inter-Bold.ttf');
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        // Verificación básica de que es un archivo font (no HTML de error)
        if (fontBuffer.byteLength > 1000) { 
          await ff.writeFile('font.ttf', new Uint8Array(fontBuffer));
          hasFont = true;
          console.log("Fuente cargada con éxito.");
        } else {
          console.warn("La fuente descargada es demasiado pequeña o inválida.");
        }
      } else {
        console.warn(`Error de red al bajar fuente: ${response.status}`);
      }
    } catch (fontErr) {
      console.warn("Falla de red al cargar la fuente:", fontErr);
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
      filterComplex += `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(durationPerImg * 25)}:s=1080x1920,setsar=1[v${i}];`;
    }

    // Concatenation
    let concatInputs = '';
    for (let i = 0; i < numImgs; i++) concatInputs += `[v${i}]`;
    filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[v_base]`;

    // Viral Subtitles (Only if font was loaded)
    let finalLabel = '[v_base]';
    if (hasFont) {
        const cleanTitle = assets.title.toUpperCase().replace(/'/g, "");
        const cleanPrice = assets.price.toUpperCase().replace(/'/g, "");
        filterComplex += `;[v_base]drawtext=text='${cleanTitle}':fontfile='font.ttf':fontcolor=yellow:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2-100:borderw=5:bordercolor=black,`;
        filterComplex += `drawtext=text='${cleanPrice}':fontfile='font.ttf':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2+50:borderw=3:bordercolor=black[v_final]`;
        finalLabel = '[v_final]';
    }

    command.push(
      '-filter_complex', filterComplex,
      '-map', finalLabel,
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
