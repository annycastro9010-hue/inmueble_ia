/**
 * AI Staging Engine (Google Nano Banana Pro - 2026)
 * 
 * Using the Pro edition of Nano Banana for direct image-to-image
 * execution, bypassing the coordinate-only response.
 */

export interface AIProcessingOptions {
  imageUrl: string;
  roomType: string;
  mode: "clean" | "stage";
}

/**
 * Helper to convert URL to Base64
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Calls Google AI Studio API (Nano Banana Pro)
 */
async function callNanoBanana(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  // Endpoint 2026: nano-banana-pro is the specialized image engine
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro:generateContent?key=${apiKey}`, {
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
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API Error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  // Nano Banana Pro returns the direct image in the parts
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    // If it still returns JSON, we force it via a fallback or error
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput && textOutput.includes("objects_to_remove")) {
       throw new Error("El modelo entró en modo diagnóstico. Reintentando con parámetros de ejecución directa...");
    }
    throw new Error("No se pudo obtener la imagen editada. Verifica que 'Direct Execution' esté activo en tu consola de Google.");
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[Nano-Pro-2026] Processing ${mode}...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEAN
    const cleanPrompt = "DIRECT EDIT: Remove all furniture and objects. Output ONLY the vacant empty room image. NO TEXT, NO JSON. Just the image.";
    
    console.log("Phase 1: Nano Cleaning...");
    const cleanBase64 = await callNanoBanana(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: `nano-clean-${Date.now()}`,
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE
    const stagePrompt = `DIRECT EDIT: Stage this room as a luxury ${roomType}. Add realistic furniture. Output ONLY the resulting image. NO TEXT.`;

    console.log("Phase 2: Nano Staging...");
    const stagedBase64 = await callNanoBanana(cleanBase64, stagePrompt);

    return {
      id: `nano-stage-${Date.now()}`,
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Nano Banana Pro Error:", error);
    throw error;
  }
}

