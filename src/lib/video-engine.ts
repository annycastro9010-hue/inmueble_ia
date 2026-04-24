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

// Función auxiliar para redimensionar imágenes antes de pasarlas a FFmpeg (esto acelera FFmpeg exponencialmente)
async function getOptimizedImageData(url: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Resolución optimizada para Reels/Shorts pero más ligera (720x1280)
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No se pudo obtener contexto de canvas");

      // Cubrir el canvas con la imagen (object-fit: cover)
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      canvas.toBlob((blob) => {
        if (!blob) return reject("Fallo al crear blob");
        const reader = new FileReader();
        reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.readAsArrayBuffer(blob);
      }, 'image/jpeg', 0.8); // Calidad 0.8 para ahorrar peso
    };
    img.onerror = () => reject("Error cargando imagen para optimización");
    img.src = url;
  });
}

export async function generatePropertyVideo(assets: PropertyVideoAssets): Promise<Blob> {
  console.log("🚀 Iniciando motor optimizado...");
  const ff = await loadFFmpeg();
  
  try {
    // 1. Optimizar y escribir imágenes (Ahorra mucho tiempo de CPU en FFmpeg)
    for (let i = 0; i < assets.imageUrls.length; i++) {
      console.log(`⚡ Optimizando imagen ${i+1}/${assets.imageUrls.length}...`);
      const data = await getOptimizedImageData(assets.imageUrls[i]);
      await ff.writeFile(`img${i}.jpg`, data);
    }

    // 2. Intentar descargar fuente
    let hasFont = false;
    try {
      const response = await fetch('https://cdn.jsdelivr.net/gh/googlefonts/inter@master/docs/font-files/Inter-Bold.ttf');
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        if (fontBuffer.byteLength > 1000) { 
          await ff.writeFile('font.ttf', new Uint8Array(fontBuffer));
          hasFont = true;
        }
      }
    } catch (e) {}

    const numImgs = assets.imageUrls.length;
    const totalDuration = 12; 
    const durationPerImg = totalDuration / numImgs;
    const fps = 25;

    const command: string[] = [];

    // Inputs (Tratamos de ser más agresivos con el corte de tiempo)
    for (let i = 0; i < numImgs; i++) {
      command.push('-loop', '1', '-t', durationPerImg.toFixed(2), '-i', `img${i}.jpg`);
    }

    // Filter Complex: Zoompan + Trim estricto
    let filterComplex = '';
    for (let i = 0; i < numImgs; i++) {
      // Forzamos d a los frames exactos y añadimos trim para que no se pase ni un frame
      const frames = Math.round(durationPerImg * fps);
      filterComplex += `[${i}:v]zoompan=z='zoom+0.001':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=720x1280,trim=duration=${durationPerImg.toFixed(2)},setpts=PTS-STARTPTS,setsar=1[v${i}];`;
    }

    let concatInputs = '';
    for (let i = 0; i < numImgs; i++) concatInputs += `[v${i}]`;
    filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[v_base]`;

    let finalLabel = '[v_base]';
    if (hasFont) {
        const cleanTitle = assets.title.toUpperCase().replace(/'/g, "");
        // Texto más arriba para que se vea en el primer impacto
        filterComplex += `;[v_base]drawtext=text='${cleanTitle}':fontfile='font.ttf':fontcolor=yellow:fontsize=50:x=(w-text_w)/2:y=200:borderw=4:bordercolor=black[v_final]`;
        finalLabel = '[v_final]';
    }

    command.push(
      '-filter_complex', filterComplex,
      '-map', finalLabel,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '32',
      '-r', '25',
      '-t', '12', // Límite total forzado de 12 segundos para evitar el bug de "video infinito"
      'output.mp4'
    );

    console.log("🎬 Ejecutando renderizado final...");
    const result = await ff.exec(command);
    
    if (result !== 0) throw new Error(`FFmpeg error ${result}`);
    
    const data = await ff.readFile('output.mp4');
    return new Blob([(data as any).buffer], { type: 'video/mp4' });
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message || "Fallo en el renderizado");
  }
}
