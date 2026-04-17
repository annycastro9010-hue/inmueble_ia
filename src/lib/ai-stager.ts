/**
 * AI Staging Engine
 * 
 * This module handles the integration with AI APIs to "clean" or "stage" properties.
 * Focuses on maintaining house structure while removing or adding furniture.
 */

export interface AIProcessingOptions {
  imageUrl: string;
  roomType: string;
  mode: "clean" | "stage";
}

/**
 * Processes a property image using AI.
 * Mode "clean": Virtual Decluttering (removes furniture).
 * Mode "stage": Virtual Staging (adds furniture).
 */
export async function processPropertyImage({ imageUrl, roomType, mode }: AIProcessingOptions) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  
  if (!apiKey) {
    console.error("REPLICATE_API_TOKEN is missing in environment variables.");
    throw new Error("AI Configuration Missing");
  }

  // Model Selection:
  // For 'clean', we use a specialized object removal model or Inpainting with a clear prompt.
  // For 'stage', we use a Diffusion model with interior design focus.
  const modelConfig = mode === "clean" 
    ? {
        // SDXL Inpainting focused on empty spaces
        version: "f86cd1bd-2950-4560-9118-a681df7311d4", 
        prompt: `An empty and vacant ${roomType}, pristine hardwood floors, clear walls, professional real estate photography, minimalist architecture, wide angle, natural sunlight, high resolution`,
        negative_prompt: "furniture, chairs, tables, beds, decor, clutter, messy, people, text, watermark, blurry"
      }
    : {
        // Virtual Staging specialized model
        version: "39ed52f2a78e934b3ba6e2418e2808c1d1a12e52b86abf2f6445b23d578ec7b0",
        prompt: `A luxuriously staged ${roomType}, modern Scandinavian furniture, elegant interior design, professional lighting, cozy atmosphere, realistic textures, high quality`,
        negative_prompt: "low quality, bad lighting, empty room, distorted furniture, unrealistic"
      };

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: modelConfig.version,
        input: {
          image: imageUrl,
          prompt: modelConfig.prompt,
          negative_prompt: modelConfig.negative_prompt,
          num_outputs: 1,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner", // Enhances detail
          apply_watermark: false
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Replicate API Error: ${errorData.detail || response.statusText}`);
    }

    const prediction = await response.json();
    
    // Note: Replicate predictions are asynchronous.
    // In a full implementation, you should poll predict.urls.get or use a webhook.
    console.log("Prediction started:", prediction.id);
    
    return prediction;

  } catch (error) {
    console.error("AI Staging Error:", error);
    throw error;
  }
}

