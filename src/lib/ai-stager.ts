/**
 * AI Staging Engine (Hybrid Mode: Gemini 2.0 + Replicate Fallback)
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
  const replicateKey = process.env.REPLICATE_API_TOKEN;

  const prompt = mode === "clean"
    ? `TASK: CLEAN ROOM PHOTOGRAPHY.
       Remove all furniture, clutter, and personal items. 
       Leave the room completely empty. 
       MANTEN PAREDES, SUELOS Y VENTANAS EXACTAMENTE IGUAL.
       Do not change architecture. 
       Return only the empty room photo.`
    : `TASK: VIRTUAL STAGING. 
       Add luxury, modern, high-end furniture to this empty room. 
       ROOM TYPE: ${roomType || 'luxurious living room'}.
       MANTEN PAREDES, SUELOS Y ARQUITECTURA EXACTAMENTE IGUAL. 
       The furniture should be attractive, modern and well-placed. 
       Return only the final professional photograph.`;

  // 1. INTENTO CON GEMINI 2.0 (GENERACIÓN DE IMAGEN)
  if (googleKey) {
    try {
      console.log(`[AI-STAGER] Intentando con Gemini 2.0 (${mode})...`);
      const base64 = await toBase64(imageUrl);
      const mimeType = getMimeType(imageUrl);

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleKey}`;

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
            responseModalities: ["IMAGE"],
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const parts = result.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inline_data?.data);
        const imgData = imagePart?.inline_data?.data;
        const imgMime = imagePart?.inline_data?.mime_type || 'image/jpeg';

        if (imgData) {
          console.log(`✅ Gemini 2.0 exitoso.`);
          return { outputUrl: `data:${imgMime};base64,${imgData}`, status: "succeeded" };
        }
      } else {
        const errorText = await response.text();
        console.warn(`[AI-STAGER] Gemini falló (${response.status}):`, errorText);
      }
    } catch (e: any) {
      console.warn("[AI-STAGER] Error en Gemini, intentando fallback:", e.message);
    }
  }

  // 2. FALLBACK A REPLICATE (MÁS ESTABLE PARA ESTO SI GEMINI FALLA)
  if (replicateKey) {
    try {
      console.log(`[AI-STAGER] Usando fallback de Replicate...`);
      // Modelos específicos para staging/cleaning
      // Usamos el modelo de staging de Replicate que es muy robusto
      const model = mode === "clean" 
        ? "30c289233cf23037243c5b96796adba23668f3a362dbd66e8fa134709d290333" // Furniture removal
        : "7762fdc0ed2343d6bb30887ee5cf93f8ce4537c1a25c2483ce6b2848f2c698c9"; // Staging

      const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { "Authorization": `Token ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          version: model, 
          input: { image: imageUrl, prompt: prompt } 
        })
      });

      const prediction = await replicateRes.json();
      
      // Como estamos en una API Route de Next.js que tiene timeout de 10-60s,
      // podemos hacer un pequeño pooling aquí mismo si es rápido.
      let currentPrediction = prediction;
      let attempts = 0;
      while ((currentPrediction.status === "starting" || currentPrediction.status === "processing") && attempts < 15) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${currentPrediction.id}`, {
          headers: { "Authorization": `Token ${replicateKey}` }
        });
        currentPrediction = await pollRes.json();
        attempts++;
      }

      if (currentPrediction.status === "succeeded") {
        const output = Array.isArray(currentPrediction.output) ? currentPrediction.output[0] : currentPrediction.output;
        console.log(`✅ Replicate exitoso.`);
        return { outputUrl: output, status: "succeeded" };
      }
      
      throw new Error(`Replicate falló con status: ${currentPrediction.status}`);
    } catch (e: any) {
      console.error("[AI-STAGER] Error en Replicate:", e.message);
      throw e;
    }
  }

  throw new Error("No hay servicios de IA disponibles o configurados correctamente.");
}
