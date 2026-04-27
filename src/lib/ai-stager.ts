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

  // 1. INTENTO CON REPLICATE PRIMERO (ES EL MÁS ESTABLE PARA TRANSFORMACIÓN DE IMAGEN)
  if (replicateKey) {
    try {
      console.log(`[AI-STAGER] Intentando con Replicate (${mode})...`);
      // Modelos específicos de alta calidad para staging/cleaning
      let modelVersion = "";
      let modelInput = {};

      if (mode === "clean") {
        modelVersion = "30c289233cf23037243c5b96796adba23668f3a362dbd66e8fa134709d290333"; // Furniture removal
        modelInput = { image: imageUrl };
      } else {
        // Modelo de Staging Profesional
        modelVersion = "7762fdc0ed2343d6bb30887ee5cf93f8ce4537c1a25c2483ce6b2848f2c698c9";
        modelInput = { 
          image: imageUrl, 
          prompt: `luxury ${roomType || 'living room'} staging, modern furniture, photorealistic, architecture intact`,
          negative_prompt: "low quality, distorted, change walls, change floor"
        };
      }

      const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { "Authorization": `Token ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version: modelVersion, input: modelInput })
      });

      const prediction = await replicateRes.json();
      if (!replicateRes.ok) throw new Error(`Replicate API Error: ${prediction.detail || 'Unknown'}`);

      console.log(`[AI-STAGER] Predicción Replicate iniciada: ${prediction.id}`);

      let currentPrediction = prediction;
      let attempts = 0;
      while ((currentPrediction.status === "starting" || currentPrediction.status === "processing") && attempts < 20) {
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
      
      console.warn(`[AI-STAGER] Replicate no tuvo éxito (status: ${currentPrediction.status}), intentando Gemini...`);
    } catch (e: any) {
      console.warn("[AI-STAGER] Error en Replicate, intentando Gemini fallback:", e.message);
    }
  }

  // 2. FALLBACK A GEMINI (PARA COMPROBAR O SI REPLICATE FALLA)
  if (googleKey) {
    try {
      console.log(`[AI-STAGER] Intentando con Gemini fallback...`);
      const base64 = await toBase64(imageUrl);
      const mimeType = getMimeType(imageUrl);

      // Usar el modelo actual de Gemini 3.0 Flash (estándar en 2026)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${googleKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt + " Generate the resulting image based on these instructions." },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini Falló (${response.status}): ${err.error?.message || 'Unknown'}`);
      }

      const result = await response.json();
      // Nota: Gemini 1.5 Flash no devuelve imágenes directas por defecto en generateContent 
      // a menos que sea una modalidad específica. Si llega aquí y no hay imagen, fallará.
      const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data?.data);
      if (imagePart?.inline_data?.data) {
        return { 
          outputUrl: `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`, 
          status: "succeeded" 
        };
      }
      
      throw new Error("Gemini no devolvió datos de imagen. El modelo no soporta generación directa aquí.");
    } catch (e: any) {
      console.error("[AI-STAGER] Error crítico IA:", e.message);
      throw e;
    }
  }

  throw new Error("No hay servicios de IA disponibles o configurados correctamente.");
}
