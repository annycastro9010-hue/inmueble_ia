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
      const targetHeight = 1280;
      // Mantenemos la relación de aspecto para permitir el paneo lateral si es panorámica
      const scale = targetHeight / img.height;
      canvas.width = img.width * scale;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No canvas context");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return reject("Blob failure");
        const reader = new FileReader();
        reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.readAsArrayBuffer(blob);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject("Error loading image");
    img.src = url;
  });
}

export async function generatePropertyVideo(assets: PropertyVideoAssets): Promise<Blob> {
  console.log("🚀 Iniciando motor panorámico...");
  const ff = await loadFFmpeg();
  
  try {
    // 1. Optimizar y escribir imágenes
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

    // Inputs
    for (let i = 0; i < numImgs; i++) {
      command.push('-loop', '1', '-t', durationPerImg.toFixed(2), '-i', `img${i}.jpg`);
    }

    // Filter Complex: Paneo horizontal
    let filterComplex = '';
    for (let i = 0; i < numImgs; i++) {
      const frames = Math.round(durationPerImg * fps);
      // Paneo horizontal: si iw > 720, movemos x de 0 al final. Si no, hacemos zoom al centro.
      filterComplex += `[${i}:v]zoompan=z='1.1':x='if(gt(iw,720),(iw-720)*on/${frames},iw/2-(iw/zoom/2))':y='ih/2-(ih/zoom/2)':d=${frames}:s=720x1280,trim=duration=${durationPerImg.toFixed(2)},setpts=PTS-STARTPTS,setsar=1[v${i}];`;
    }

    let concatInputs = '';
    for (let i = 0; i < numImgs; i++) concatInputs += `[v${i}]`;
    filterComplex += `${concatInputs}concat=n=${numImgs}:v=1:a=0[v_base]`;

    let finalLabel = '[v_base]';
    if (hasFont) {
        const cleanTitle = assets.title.toUpperCase().replace(/'/g, "");
        filterComplex += `;[v_base]drawtext=text='${cleanTitle}':fontfile='font.ttf':fontcolor=yellow:fontsize=50:x=(w-text_w)/2:y=200:borderw=4:bordercolor=black[v_final]`;
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
      '-t', '12',
      'output.mp4'
    );

    console.log("🎬 Renderizando efecto panorámico...");
    const result = await ff.exec(command);
    
    if (result !== 0) throw new Error(`FFmpeg error ${result}`);
    
    const data = await ff.readFile('output.mp4');
    return new Blob([(data as any).buffer], { type: 'video/mp4' });
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message || "Fallo en el renderizado");
  }
}
