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
        // MVP Interior Design for Decluttering
        version: "76604b3ab357832e44d1ad3b47a0664445657390ee85549033486c673130767c", 
        prompt: `An empty and vacant room, no furniture, high quality architecture, professional real estate photography`,
        negative_prompt: "furniture, chairs, tables, beds, decor, clutter, messy, people, text, watermark, blurry"
      }
    : {
        // SDXL Interior Design for Virtual Staging
        version: "de77f3e6a06692998a4421b933390cc52b6188b2ea57077e31d4d8a576c24f9f",
        prompt: `A luxuriously staged ${roomType || 'room'}, high-end modern furniture, elegant interior design, professional real estate photography, 8k, highly detailed`,
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
          guidance_scale: 8.0,
          num_inference_steps: 50
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

