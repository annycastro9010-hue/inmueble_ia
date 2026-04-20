/**
 * AI Staging Engine (Firefly Mode - Pro Quality 2026)
 * 
 * Optimized to preserve architectural structure (walls, windows, doors)
 * using a hybrid Google/Replicate pipeline.
 */

export interface AIProcessingOptions {
  imageUrl: string;
  roomType: string;
  mode: "clean" | "stage";
}

/**
 * Proxy to bypass CORS when sending images to AI
 */
async function getProxyImageBase64(url: string): Promise<string> {
  try {
    // Intentamos cargarla directamente primero
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (e) {
    // Si falla por CORS, usamos un proxy público (común en desarrollo)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    return data.contents.split(',')[1]; // Extraer base64
  }
}

async function callGeminiFirefly(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `ACT AS ADOBE FIREFLY. ${prompt}. STICK TO THE ARCHITECTURAL STRUCTURE. DO NOT ALTER WALLS, WINDOWS, OR DOORS. Return only the image.` },
          { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ]
      }],
      generationConfig: { temperature: 0.1, topP: 0.95 }
    })
  });

  if (response.status === 429) throw new Error("QUOTA");
  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
}

async function callReplicateFirefly(imageUrl: string, prompt: string, mode: string) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  const version = mode === "clean" 
    ? "30c289233cf23037243c5b96796adba23668f3a362dbd66e8fa134709d290333" 
    : "7762fdc0ed2343d6bb30887ee5cf93f8ce4537c1a25c2483ce6b2848f2c698c9";

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { "Authorization": `Token ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      version,
      input: {
        image: imageUrl,
        prompt: `${prompt}, architectural photography, high resolution, empty room, realistic textures`,
        negative_prompt: "distorted architecture, changing windows, extra walls, blurry",
        num_inference_steps: 50
      }
    })
  });

  const prediction = await response.json();
  let result = prediction;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise(r => setTimeout(r, 2000));
    const p = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { "Authorization": `Token ${apiKey}` }
    });
    result = await p.json();
  }
  return Array.isArray(result.output) ? result.output[0] : result.output;
}

export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[FIREFLY-MODE] Processing ${mode}...`);
    
    const prompt = mode === "clean"
      ? "CLEANING TASK: Remove all furniture and debris. KEEP structure, walls, windows, and doors EXACTLY as they are. Modern clean floor texture."
      : `STAGING TASK: Add luxury ${roomType} furniture. Photorealistic real estate style. Respect the room dimensions.`;

    try {
      // Intento 1: Google Gemini (Estructural)
      const base64 = await getProxyImageBase64(imageUrl);
      const outputBase64 = await callGeminiFirefly(base64, prompt);
      if (outputBase64) {
        return { id: `google-${Date.now()}`, outputUrl: `data:image/jpeg;base64,${outputBase64}`, status: "succeeded" };
      }
    } catch (e: any) {
      if (e.message !== "QUOTA") throw e;
      console.warn("Quota exceeded, switching to Replicate High-Def...");
    }

    // Intento 2: Replicate (Calidad Pro)
    const outputUrl = await callReplicateFirefly(imageUrl, prompt, mode);
    return { id: `replicate-${Date.now()}`, outputUrl, status: "succeeded" };

  } catch (error: any) {
    console.error("Firefly Mode Error:", error);
    throw error;
  }
}




