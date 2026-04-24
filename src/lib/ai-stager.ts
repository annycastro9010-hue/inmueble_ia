/**
 * AI Staging Engine - Google Gemini Image Generation
 * ────────────────────────────────────────────────────
 * Usa gemini-2.0-flash-preview-image-generation que SÍ genera imágenes.
 * El modelo anterior (1.5-flash) solo devolvía texto, por eso salía en blanco.
 */

export interface AIProcessingOptions {
  imageUrl: string;
  roomType: string;
  mode: "clean" | "stage";
}

async function toBase64(url: string): Promise<string> {
  const response = await fetch(url);
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

  // ── PROMPT DE ALTA FIDELIDAD ──
  // Instrucción explícita para mantener la arquitectura exacta
  const prompt = mode === "clean"
    ? `You are a professional virtual staging AI. 
       TASK: Remove ALL furniture, objects, and decorations from this room photo.
       STRICT RULES:
       - Keep walls, floors, ceiling, windows, and doors EXACTLY as they are
       - Do NOT change colors, textures or structure of any architectural element
       - Remove sofas, tables, chairs, lamps, rugs, paintings, curtains, and ANY movable object
       - The output must look like an empty, clean, freshly-renovated room
       - Return ONLY the photograph, no text`
    : `You are a luxury interior design AI for real estate marketing.
       TASK: Add beautiful, modern, high-end furniture to this empty/unfurnished room.
       ROOM TYPE: ${roomType || 'living room'}
       STRICT RULES:
       - Keep walls, floors, ceiling, windows, doors EXACTLY as they are — do NOT alter them
       - Do NOT change paint colors, flooring material, or architectural features
       - Add coordinated, stylish, contemporary furniture appropriate for the room type
       - Use a warm, inviting color palette for the furniture
       - Ensure the room looks luxurious, photo-ready for real estate marketing
       - The result should look like a professional interior design photo shoot
       - Return ONLY the photograph, no text`;

  if (!googleKey) {
    throw new Error("GOOGLE_AI_STUDIO_API_KEY no está configurada en las variables de entorno.");
  }

  try {
    const base64 = await toBase64(imageUrl);
    const mimeType = getMimeType(imageUrl);

    // ── MODELO CORRECTO: gemini-2.0-flash-preview-image-generation ──
    // Este es el único modelo de Google AI Studio que GENERA imágenes
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleKey}`;

    const controller = new AbortController();
    // 55 segundos de timeout (generación de imagen tarda más que texto)
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }],
        generationConfig: {
          // CRÍTICO: sin esto, Gemini solo devuelve texto
          responseModalities: ["IMAGE", "TEXT"],
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Google API error:", response.status, errBody);
      throw new Error(`Google API respondió ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const result = await response.json();

    // Extraer datos de imagen de la respuesta
    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inline_data?.data);
    const imgData = imagePart?.inline_data?.data;
    const imgMime = imagePart?.inline_data?.mime_type || 'image/jpeg';

    if (imgData) {
      console.log(`✅ Gemini generó imagen correctamente (${(imgData.length * 0.75 / 1024).toFixed(0)}KB)`);
      return {
        outputUrl: `data:${imgMime};base64,${imgData}`,
        status: "succeeded"
      };
    }

    // Si no hay imagen, loguear qué devolvió para debugging
    const textPart = parts.find((p: any) => p.text);
    console.error("Gemini no devolvió imagen. Texto:", textPart?.text?.slice(0, 300));
    throw new Error("Gemini procesó la solicitud pero no generó una imagen. Verifica que tu clave de API tenga acceso a gemini-2.0-flash-preview-image-generation.");

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error("La generación tardó más de 55 segundos. Intenta con una imagen más pequeña.");
    }
    console.error("Error en Stager:", error);
    throw error;
  }
}
