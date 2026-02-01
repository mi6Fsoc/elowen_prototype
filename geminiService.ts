
import { GoogleGenAI, Type } from "@google/genai";
import { SkinAssessment, DailyRoutine, SkinAnalysis } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateRoutine(assessment: SkinAssessment): Promise<DailyRoutine> {
  const prompt = `Based on this skin assessment, generate a personalized AM and PM skincare routine.
  Skin Type: ${assessment.skinType}
  Concerns: ${assessment.concerns.join(', ')}
  Sensitivity (1-5): ${assessment.sensitivity}
  Lifestyle: ${assessment.lifestyle.join(', ')}
  
  Explain why each step is included and what ingredients/features to look for in products.
  For each step, provide 2-3 real product recommendations that fit this skin profile. 
  For each recommendation, estimate the "hydrationImpact" (e.g. "High", "Medium", or "Low") based on the product's typical formulation.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          am: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                whyNeeded: { type: Type.STRING },
                whatToLookFor: { type: Type.STRING },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      description: { type: Type.STRING },
                      learnMoreUrl: { type: Type.STRING },
                      hydrationImpact: { type: Type.STRING, description: "The level of hydration this product provides, e.g., 'High', 'Medium', 'Low'" }
                    },
                    required: ["productName", "description", "learnMoreUrl", "hydrationImpact"]
                  }
                }
              },
              required: ["id", "name", "type", "description", "whyNeeded", "whatToLookFor", "recommendations"]
            }
          },
          pm: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                whyNeeded: { type: Type.STRING },
                whatToLookFor: { type: Type.STRING },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      description: { type: Type.STRING },
                      learnMoreUrl: { type: Type.STRING },
                      hydrationImpact: { type: Type.STRING, description: "The level of hydration this product provides, e.g., 'High', 'Medium', 'Low'" }
                    },
                    required: ["productName", "description", "learnMoreUrl", "hydrationImpact"]
                  }
                }
              },
              required: ["id", "name", "type", "description", "whyNeeded", "whatToLookFor", "recommendations"]
            }
          }
        },
        required: ["am", "pm"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeSkinPhoto(base64Image: string): Promise<Partial<SkinAnalysis>> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Analyze this skin photo. Provide numerical metrics (0-100) for hydration, clarity, texture, and redness. Also provide a summary and a supportive coach's note." }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metrics: {
            type: Type.OBJECT,
            properties: {
              hydration: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              texture: { type: Type.NUMBER },
              redness: { type: Type.NUMBER }
            }
          },
          summary: { type: Type.STRING },
          coachNote: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
