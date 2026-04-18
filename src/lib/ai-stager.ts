/**
 * AI Staging Engine (Google Nano Banana Edition)
 * 
 * This module handles integration with Google AI Studio (Gemini 3.1)
 * to perform virtual decluttering and staging without manual masks.
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
 * Calls Google AI Studio API (Gemini 3.1 / Nano Banana)
 */
async function callGeminiNano(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
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
        temperature: 0.4,
        topP: 0.9,
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API Error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  // In 2026, the API returns the edited image directly in candidates[0].content.parts[0].inline_data
  const outputBase64 = result.candidates[0].content.parts.find((p: any) => p.inline_data)?.inline_data.data;
  
  if (!outputBase64) {
    // If it returns text instead of image, it might be a fallback or block
    throw new Error("AI did not return an image. Check prompt constraints.");
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`Starting ${mode} process for ${imageUrl}...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: ALWAYS CLEAN (Declutter)
    // This removes furniture without damaging the structure
    const cleanPrompt = "ACT AS AN ARCHITECTURAL PHOTOGRAPHER. Remove all furniture, curtains, clutter, and personal items. Clean the floors and walls. DO NOT change the room structure, doors, or windows. The output MUST be a completely EMPTY, VACANT room with pristine walls and floors.";
    
    console.log("Cleaning room (Phase 1)...");
    const cleanBase64 = await callGeminiNano(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: Date.now().toString(),
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE (If requested)
    // We use the cleaned image as a base for perfect integration
    const stagePrompt = `Virtual Stage this empty room into a luxury ${roomType}. Add modern, stylish furniture (sofas, rugs, art, lamps). Use realistic materials. KEEP the walls and structure exactly as they are in the empty photo. High-end real estate photography style.`;

    console.log("Furnishing room (Phase 2)...");
    const stagedBase64 = await callGeminiNano(cleanBase64, stagePrompt);

    return {
      id: Date.now().toString(),
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Nano Banana Workflow Error:", error);
    throw error;
  }
}

