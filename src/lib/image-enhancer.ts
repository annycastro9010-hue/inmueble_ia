/**
 * image-enhancer.ts
 * ─────────────────────────────────────────────────────
 * Pipeline de mejora automática de calidad de imagen.
 * Funciona como YouTube: detecta resolución y mejora si
 * está por debajo del umbral mínimo (1200px de ancho).
 * Si ya tiene buena calidad, la pasa sin tocar.
 */

const MIN_WIDTH_PX = 1200;

export interface EnhancementResult {
  blob: Blob;
  enhanced: boolean;
  originalSize: string;
  finalSize: string;
  message: string;
}

/**
 * Detecta la resolución real de un File/Blob de imagen en el browser.
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convierte un dataURL base64 a un Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

/**
 * Función principal: analiza una imagen y la mejora si es necesario.
 * Se llama justo antes de subir a Supabase Storage.
 * Completamente automático — sin aprobación del usuario.
 */
export async function autoEnhanceImage(file: File): Promise<EnhancementResult> {
  // 1. Detectar dimensiones reales en el browser
  const { width, height } = await getImageDimensions(file);
  const originalSize = `${width}x${height}`;

  // 2. Si ya tiene buena calidad, NO tocar
  if (width >= MIN_WIDTH_PX) {
    return {
      blob: file,
      enhanced: false,
      originalSize,
      finalSize: originalSize,
      message: `✅ Calidad OK (${width}px) — sin cambios`,
    };
  }

  // 3. Enviar al servidor para upscaling con Sharp (Lanczos + sharpen)
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/enhance', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.warn('enhance API falló, usando imagen original:', err);
    // Fallback: usar imagen original si el servidor falla
    return {
      blob: file,
      enhanced: false,
      originalSize,
      finalSize: originalSize,
      message: `⚠️ Mejora fallida, usando original`,
    };
  }

  const result = await response.json();

  // 4. Convertir dataUrl a Blob para poder subirlo a Supabase
  const enhancedBlob = dataUrlToBlob(result.dataUrl);

  return {
    blob: enhancedBlob,
    enhanced: result.enhanced,
    originalSize: result.originalSize,
    finalSize: result.finalSize,
    message: result.enhanced
      ? `⬆️ Mejorada: ${result.originalSize} → ${result.finalSize}`
      : `✅ Calidad OK — sin cambios`,
  };
}
