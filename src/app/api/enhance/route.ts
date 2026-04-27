import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Umbral mínimo de calidad
const MIN_WIDTH = 1200;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 1. LEER METADATOS REALES DE LA IMAGEN
    const metadata = await sharp(inputBuffer).metadata();
    const { width = 0, height = 0, format } = metadata;

    console.log(`📸 Imagen recibida: ${width}x${height} (${format})`);

    // 2. VERIFICAR SI NECESITA MEJORA O REDUCCIÓN (MAX 3000px para evitar errores de memoria)
    const MAX_WIDTH = 3000;
    
    if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
      // Calidad ya es buena y no es excesivamente pesada — devolver tal cual en base64
      console.log(`✅ Calidad OK (${width}px), sin cambios.`);
      const base64 = inputBuffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';
      return NextResponse.json({
        enhanced: false,
        originalSize: `${width}x${height}`,
        finalSize: `${width}x${height}`,
        dataUrl: `data:${mimeType};base64,${base64}`,
      });
    }

    // 3. NECESITA MEJORA (Upscale) O REDUCCIÓN (Downscale)
    let newWidth = width;
    let newHeight = height;

    if (width < MIN_WIDTH) {
      const scaleFactor = MIN_WIDTH / width;
      newWidth = MIN_WIDTH;
      newHeight = Math.round(height * scaleFactor);
      console.log(`⬆️ Escalando de ${width}x${height} → ${newWidth}x${newHeight}`);
    } else if (width > MAX_WIDTH) {
      const scaleFactor = MAX_WIDTH / width;
      newWidth = MAX_WIDTH;
      newHeight = Math.round(height * scaleFactor);
      console.log(`⬇️ Reduciendo de ${width}x${height} → ${newWidth}x${newHeight} (por exceso de peso)`);
    }

    // 4. PROCESAR CON SHARP: Upscale + Sharpen + Optimización
    const enhancedBuffer = await sharp(inputBuffer)
      // Redimensionar con el algoritmo Lanczos (el más fiel para fotografías)
      .resize(newWidth, newHeight, {
        fit: 'fill',
        kernel: sharp.kernel.lanczos3,
      })
      // Enfocar ligeramente para compensar el upscaling (simula super-resolución)
      .sharpen({
        sigma: 1.2,       // Radio de enfoque (1.0–3.0 es el rango recomendado)
        m1: 1.5,          // Brillo en bordes nítidos
        m2: 0.5,          // Brillo en bordes suaves
        x1: 2,
        y2: 12,
        y3: 10,
      })
      // Mejorar contraste y color ligeramente
      .modulate({
        brightness: 1.03,   // +3% de brillo
        saturation: 1.08,   // +8% de saturación (colores más vivos)
      })
      // Guardar como JPEG de alta calidad
      .jpeg({ quality: 92, progressive: true, mozjpeg: true })
      .toBuffer();

    const base64Enhanced = enhancedBuffer.toString('base64');

    console.log(`✅ Mejora completada: ${newWidth}x${newHeight} (${(enhancedBuffer.length / 1024).toFixed(0)}KB)`);

    return NextResponse.json({
      enhanced: true,
      originalSize: `${width}x${height}`,
      finalSize: `${newWidth}x${newHeight}`,
      dataUrl: `data:image/jpeg;base64,${base64Enhanced}`,
    });

  } catch (error: any) {
    console.error('Error en enhance route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
