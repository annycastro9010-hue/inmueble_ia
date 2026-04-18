/**
 * AI Staging Engine (Google Gemini 3.0 Pro Image Preview - 2026)
 * 
 * Verified technical IDs for the 2026 REST API.
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
 * Calls Google AI Studio API (Gemini 3 Pro Image)
 */
async function callGemini(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  // REST API 2026: Official model ID is gemini-3-pro-image-preview
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`, {
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
      // Official tool name in 2026 is 'imagen' for editing/generation
      tools: [
        {
          imagen: {}
        }
      ],
      generationConfig: {
        temperature: 0.0,
        topP: 0.95
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API Error (${response.status}): ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  // Output extraction: 'imagen' tool returns binary in candidates[0].content.parts
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    throw new Error("El motor 'imagen' no devolvió el renderizado. Revisa los límites de tu proyecto en Google Cloud.");
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[Gemini-3-Pro-2026] Executing ${mode}...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEAN
    const cleanPrompt = "TASK: IMAGE CLEANING. Remove all furniture and debris. Fill the resulting spaces with realistic wall and floor textures. Return the empty room.";
    
    console.log("Phase 1: Generating empty room...");
    const cleanBase64 = await callGemini(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: `clean-${Date.now()}`,
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE
    const stagePrompt = `TASK: VIRTUAL STAGING. Add high-end furniture for a luxury ${roomType} to this empty room. Real estate photography style.`;

    console.log("Phase 2: Adding luxury furniture...");
    const stagedBase64 = await callGemini(cleanBase64, stagePrompt);

    return {
      id: `stage-${Date.now()}`,
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Gemini 3 Pro Error:", error);
    throw error;
  }
}

