/**
 * AI Staging Engine (Async Mode - Anti-Timeout 2026)
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

export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  const googleKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  const replicateKey = process.env.REPLICATE_API_TOKEN;

  try {
    // Prompt exacto sugerido por el usuario para máxima fidelidad
    const prompt = mode === "clean"
      ? "MANTEN LAS PAREDES, SUELOS Y ARQUITECTURA EXACTAMENTE IGUAL. NO DAÑES NADA. ELIMINA TODOS LOS MUEBLES. DEVUELVE SOLO LA FOTOGRAFÍA VACÍA."
      : `MANTEN LAS PAREDES, TECHOS Y SUELOS EXACTAMENTE IGUAL. NO DAÑES NADA. AMUEBLA ESTA HABITACIÓN CON ESTILO MODERNO Y LUJOSO PARA UN AMBIENTE DE ${roomType.toUpperCase()}. DEVUELVE SOLO LA FOTOGRAFÍA FINAL.`;

    // 1. INTENTO RAPIDO CON GOOGLE (Máximo 8 seg)
    if (googleKey) {
      try {
        const base64 = await toBase64(imageUrl);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleKey}`;
        
        // Timeout manual para Google de 8 segundos para no bloquear la función
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64 } }] }]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
          if (imgData) return { outputUrl: `data:image/jpeg;base64,${imgData}`, status: "succeeded" };
        }
      } catch (e) {
        console.warn("Google tardó mucho o falló, pasando a Replicate Async...");
      }
    }

    // 2. REPLICATE ASYNC (Para evitar el error 504 de Vercel)
    if (replicateKey) {
      const version = mode === "clean" 
        ? "30c289233cf23037243c5b96796adba23668f3a362dbd66e8fa134709d290333" 
        : "7762fdc0ed2343d6bb30887ee5cf93f8ce4537c1a25c2483ce6b2848f2c698c9";

      const predRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { "Authorization": `Token ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version, input: { image: imageUrl, prompt } })
      });

      const prediction = await predRes.json();
      // DEVOLVEMOS LA PREDICCIÓN INCOMPLETA. El frontend se encarga de esperar.
      return { 
        id: prediction.id, 
        status: "processing", 
        pollingUrl: prediction.urls.get 
      };
    }

    throw new Error("No hay llaves de API configuradas.");

  } catch (error: any) {
    console.error("Error en Stager:", error);
    throw error;
  }
}






