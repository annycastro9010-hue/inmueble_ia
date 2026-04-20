/**
 * AI Staging Engine (Google Gemini 3.1 Flash - Nano Banana 2026)
 * 
 * Optimized for local and Vercel deployments using native multimodal editing.
 */

export interface AIProcessingOptions {
  imageUrl: string;
  roomType: string;
  mode: "clean" | "stage";
}

/**
 * Helper: URL to Base64
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Calls Google AI Studio API (Gemini 3.1 Flash)
 * Using NATIVE MULTIMODAL EDITING (no individual tools required in 2026)
 */
async function callGemini(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  // Endpoint 2026 para la versión de producción en Vercel
  const model = "gemini-3.1-flash-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }],
      // FIX 400: Eliminamos el bloque 'tools' que causaba el error de validación
      generationConfig: {
        temperature: 0.4, // Un poco más de creatividad para el staging
        topP: 0.9,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google AI Studio Error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  
  // En Gemini 3.1, el renderizado vuelve como inline_data en la primera parte de la respuesta
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    // Si no hay imagen, revisamos si el modelo respondió con texto (posible bloqueo de seguridad)
    const textOutput = result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
    if (textOutput) throw new Error(`AI Safety/Info: ${textOutput}`);
    throw new Error("El motor de Google no devolvió la imagen procesada. Revisa los filtros de seguridad en AI Studio.");
  }

  return outputBase64;
}

/**
 * Workflow: Clean then Stage (Propiedad IA)
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[Google-AI-2026] Processing ${mode}...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEANING
    const cleanPrompt = "IMAGE EDITING TASK: Remove ALL furniture and clutter. Show a completely empty room with pristine walls and floors. Return ONLY the edited image.";
    
    console.log("Status: Generating empty room shell...");
    const cleanBase64 = await callGemini(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: `google-clean-${Date.now()}`,
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGING
    const stagePrompt = `IMAGE EDITING TASK: Add high-end modern furniture for a ${roomType}. Professional interior design style. Return ONLY the edited image.`;

    console.log(`Status: Furnishing ${roomType}...`);
    const stagedBase64 = await callGemini(cleanBase64, stagePrompt);

    return {
      id: `google-stage-${Date.now()}`,
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error: any) {
    console.error("Gemini 3.1 Stager Error:", error);
    throw error;
  }
}


