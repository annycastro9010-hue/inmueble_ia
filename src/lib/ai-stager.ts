/**
 * AI Staging Engine (Hybrid Mode: Robust Fallback Architecture)
 * ────────────────────────────────────────────────────
 */

export interface AIProcessingOptions {
  imageUrl: string;
  roomType: string;
  mode: "clean" | "stage";
}

async function toBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error al descargar imagen: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

function getMimeType(url: string): string {
  if (url.includes('.png')) return 'image/png';
  if (url.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  const googleKey = process.env.GOOGLE_AI_STUDIO_API_KEY;

  if (!googleKey) {
    throw new Error("❌ Error: GOOGLE_AI_STUDIO_API_KEY no configurada. Necesitas la llave de Google AI Studio.");
  }

  // MOTOR UNIFICADO: GEMINI 3.1 FLASH IMAGE (Nativo 2026)
  try {
    console.log(`[AI-STAGER] Generando imagen con Gemini 3.1 Flash Image...`);
    const base64 = await toBase64(imageUrl);
    const mimeType = getMimeType(imageUrl);

    // Endpoint v1beta para modelos multimodales con salida de imagen (Nano Banana 2)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${googleKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${prompt} Modifica la imagen para cumplir la tarea y devuelve UNICAMENTE la nueva imagen en formato visual de alta calidad.` },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }],
        generationConfig: {
          // Configuración crucial para que la IA devuelva píxeles (disponible en 2026)
          responseModalities: ["IMAGE"]
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Google API Error (${response.status}): ${err.error?.message || 'Unknown'}`);
    }

    const result = await response.json();
    
    // Extraer la imagen de la respuesta multimodal
    const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data?.data);
    
    if (imagePart?.inline_data?.data) {
      console.log(`✅ Imagen generada exitosamente por Google AI.`);
      return { 
        outputUrl: `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`, 
        status: "succeeded" 
      };
    }
    
    // Si no devolvió imagen, explicar qué dijo la IA (ej: rechazo por seguridad o capacidad)
    const textResponse = result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
    throw new Error(`La IA de Google no devolvió una imagen. Respuesta: ${textResponse || 'Sin detalles'}`);

  } catch (e: any) {
    console.error("[AI-STAGER] Error crítico en motor Google:", e.message);
    throw e;
  }
}
