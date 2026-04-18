/**
 * AI Staging Engine (Google Gemini Edition)
 * 
 * Optimized for Gemini 1.5 Flash to ensure high quota and structural stability.
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
 * Calls Google AI Studio API (Gemini 1.5 Flash)
 */
async function callGemini(base64Image: string, prompt: string) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY missing");

  // Using Gemini 1.5 Flash for maximum availability
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
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
        temperature: 0.1, // Lower temperature for more structural consistency
        topP: 0.95,
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API Error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  // Gemini 1.5 returns images in candidates[0].content.parts.
  // We look for the one with inline_data
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    console.error("Gemini Response:", JSON.stringify(result));
    throw new Error("La IA no devolvió una imagen procesada. Posible bloqueo de seguridad o prompt no admitido.");
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`Starting ${mode} process for ${imageUrl} using Gemini 1.5 Flash...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEAN (Declutter)
    const cleanPrompt = "IMAGE EDITING TASK: Remove all furniture, clutter, and personal items. Show the empty room with its original architectural structure. KEEP walls, windows, and floors intact. Output ONLY the empty room image.";
    
    console.log("Phase 1: Generating empty room...");
    const cleanBase64 = await callGemini(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: Date.now().toString(),
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE (If requested)
    const stagePrompt = `VIRTUAL STAGING TASK: Take this empty room and add high-end, modern furniture for a ${roomType}. Use professional real estate photography style. DO NOT change the room structure. Make it look ready to sell.`;

    console.log("Phase 2: Adding virtual staging...");
    const stagedBase64 = await callGemini(cleanBase64, stagePrompt);

    return {
      id: Date.now().toString(),
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Gemini Stager Error:", error);
    throw error;
  }
}

