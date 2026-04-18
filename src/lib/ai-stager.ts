/**
 * AI Staging Engine (Google Gemini 3.0 Edition - 2026)
 * 
 * Updated for the 2026 architecture using Gemini 3.0 Flash and Nano Banana Pro.
 * Provides maximum speed and structural consistency for real estate.
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
 * Calls Google AI Studio API (Gemini 3.0 Flash Preview)
 * Note: This model is the 2026 standard for high-speed multimodal tasks.
 */
async function callGemini(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  // Endpoint 2026: v1beta required for Gemini 3.0 series
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
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
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API 2026 Error (${response.status}): ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  // 2026 Response Parsing: Image usually found in the first part with inlineData
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    // Check if the model returned text instead of an image (sometimes happens if prompt is too vague)
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      console.warn("AI returned text instead of image:", textOutput);
    }
    throw new Error("El modelo Gemini 3 no pudo generar la imagen. Revisa los permisos de 'Nano Tools' en tu consola de Google AI Studio.");
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[2026] Processing ${mode} for room: ${roomType || 'general'} using Gemini 3.0...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEAN (Declutter)
    const cleanPrompt = "TASK: Virtual Decluttering. REMOVE all furniture, personal items, and debris. KEEP ONLY walls, ceiling, and architectural elements. Output a vacant version of this room.";
    
    console.log("Phase 1/2: Decluttering space...");
    const cleanBase64 = await callGemini(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: `clean-${Date.now()}`,
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE (If requested)
    const stagePrompt = `TASK: Virtual Staging. Take this VACANT room and furnish it as a high-end luxury ${roomType}. Use contemporary professional design. DO NOT change doors or windows. Maintain realistic textures.`;

    console.log("Phase 2/2: Staging with modern design...");
    const stagedBase64 = await callGemini(cleanBase64, stagePrompt);

    return {
      id: `stage-${Date.now()}`,
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Gemini 3 Stager Error:", error);
    throw error;
  }
}

