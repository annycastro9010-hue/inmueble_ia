/**
 * AI Staging Engine (Google Gemini 3.0 Editor - 2026)
 * 
 * Reverting to the verified Gemini 3 Flash Preview model
 * but forcing the 'image_editor' tool to avoid JSON-only responses.
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
      // REQUIRED FOR 2026: Enable the image editor tool to avoid diagnostic JSON
      tools: [
        {
          // @ts-ignore - Specific 2026 tool naming
          image_editor: {}
        }
      ],
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
  
  // Look for the image in the parts returned by the image_editor tool
  const outputBase64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inline_data)?.inline_data?.data;
  
  if (!outputBase64) {
    // If it still returns text/JSON, we show it to debug
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) throw new Error(`La IA respondió con texto/JSON en lugar de imagen: ${textOutput.substring(0, 100)}...`);
    throw new Error("El editor de imagen no devolvió datos. Revisa si el modelo 'gemini-3-flash-preview' tiene habilitado el Image Editor en tu consola.");
  }

  return outputBase64;
}

/**
 * Processes a property image using the "Clean then Stage" workflow.
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  try {
    console.log(`[Gemini-3-Editor-2026] Processing ${mode}...`);
    const originalBase64 = await urlToBase64(imageUrl);

    // STEP 1: CLEAN
    const cleanPrompt = "EXECUTE IMAGE EDIT: Remove all furniture and personal belongings. Output ONLY the resulting image of the vacant room.";
    
    console.log("Phase 1: Editor Cleaning...");
    const cleanBase64 = await callGemini(originalBase64, cleanPrompt);

    if (mode === "clean") {
      return { 
        id: `clean-${Date.now()}`,
        outputUrl: `data:image/jpeg;base64,${cleanBase64}`,
        status: "succeeded"
      };
    }

    // STEP 2: STAGE
    const stagePrompt = `EXECUTE IMAGE EDIT: Stage this room with modern luxury furniture for a ${roomType}. Output ONLY the new image.`;

    console.log("Phase 2: Editor Staging...");
    const stagedBase64 = await callGemini(cleanBase64, stagePrompt);

    return {
      id: `stage-${Date.now()}`,
      outputUrl: `data:image/jpeg;base64,${stagedBase64}`,
      status: "succeeded"
    };

  } catch (error) {
    console.error("Gemini 3 Editor Error:", error);
    throw error;
  }
}

