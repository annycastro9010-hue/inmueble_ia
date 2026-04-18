/**
 * AI Staging Engine (Google Gemini 3.0 Edition - 2026)
 * 
 * Updated with Relaxed Safety Settings (BLOCK_NONE) 
 * to prevent false positives in property images.
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
 */
async function callGemini(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

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
      // REQUIRED FOR 2026: Relax safety to avoid blocking house photos
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        temperature: 0.0, // Maximum consistency for architectural tasks
        topP: 0.95,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API Error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  // Try to find image data in response
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    const reason = result.promptFeedback?.blockReason || result.candidates?.[0]?.finishReason || "UNKNOWN_BLOCK";
    const msg = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (msg) throw new Error(`La IA dice: "${msg}"`);
    throw new Error(`Google bloqueó la imagen por seguridad (Razón: ${reason}). Intenta con otra foto o revisa tu consola de Google AI Studio.`);
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[2026-SAFE] Processing ${mode} for room...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEAN
    const cleanPrompt = "EDIT: Remove every single piece of furniture and clutter. Leave only the empty architectural shell (walls, ceiling, floor). DO NOT ADD ANYTHING. Be extremely minimal.";
    
    console.log("Phase 1: Getting empty room...");
    const cleanBase64 = await callGemini(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: `clean-${Date.now()}`,
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE
    const stagePrompt = `VIRTUAL STAGING: Add ultra-modern, professional real estate furniture and lighting for a ${roomType}. Keep walls and floor as they are in the empty image. High-end architectural rendering style.`;

    console.log("Phase 2: Adding staging...");
    const stagedBase64 = await callGemini(cleanBase64, stagePrompt);

    return {
      id: `stage-${Date.now()}`,
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Gemini 3 Safe Stager Error:", error);
    throw error;
  }
}

