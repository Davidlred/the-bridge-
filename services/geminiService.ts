import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlanResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean base64 string
const cleanBase64 = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, "");

export const generatePlan = async (
  routine: string,
  goal: string,
  dayContext: number = 1
): Promise<PlanResponse> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze the gap between the user's current routine and their goal.
    Current Routine: "${routine}"
    Goal: "${goal}"
    Context: This is Day ${dayContext} of their journey.
    
    Create a concrete, actionable daily to-do list (max 5 items) that bridges this gap for TODAY.
    If the day count is high, increase difficulty slightly or focus on consistency.
    Also provide a short, punchy, dark-themed motivational quote relevant to Day ${dayContext}.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            impactScore: { type: Type.INTEGER, description: "Value 1-10 representing importance" },
          },
          required: ["title", "description", "impactScore"],
        },
      },
      quote: { type: Type.STRING },
    },
    required: ["tasks", "quote"],
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a ruthless but effective productivity coach. Be concise. High contrast.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PlanResponse;
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Plan generation failed:", error);
    throw error;
  }
};

export const generateFutureSelf = async (
  imageBase64: string,
  goal: string
): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const mimeType = imageBase64.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

  const prompt = `
    Transform this person into their future self who has achieved this goal: "${goal}".
    The style should be: High contrast, cinematic lighting, black and white or muted desaturated colors, epic, successful, stoic, powerful.
    Keep the facial features recognizable but enhanced by success (better grooming, confident posture, appropriate attire for the goal).
    Background should be abstract dark or minimal.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64(imageBase64),
            },
          },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation failed:", error);
    return imageBase64; 
  }
};

export const generateCurrentRoutineImage = async (
  imageBase64: string,
  routine: string
): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const mimeType = imageBase64.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

  const prompt = `
    Show this person 5 years in the future if they rigidly stick to this current daily routine: "${routine}" without changing anything.
    The style should be: High contrast, black and white, gritty, film noir.
    The person should look slightly weary, stagnant, stuck in a loop, unfulfilled, or bored.
    Keep facial features recognizable but reflect the lack of progress.
    Background should be mundane, cluttered, or confining.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64(imageBase64),
            },
          },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Routine Image generation failed:", error);
    return imageBase64; 
  }
};

export const sendChatMessage = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string,
  isStudyMode: boolean = false
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const normalInstruction = "You are a mentor and strategist inside the app 'The Bridge'. Help the user achieve their goals, discuss study topics, and keep them motivated. Be concise, direct, and encouraging but realistic.";
  
  const studyInstruction = `
    You are an academic tutor and subject matter expert in 'Study Mode'. 
    Your goal is to provide structured, distraction-free learning paths related to the user's goal.
    - Do not use conversational filler or small talk.
    - Use bullet points, numbered lists, and clear headings.
    - Focus strictly on factual information, methodologies, and study plans.
    - Break down complex concepts into digestible steps.
  `;

  try {
    const chat = ai.chats.create({
      model,
      history,
      config: {
        systemInstruction: isStudyMode ? studyInstruction : normalInstruction,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm focusing on your goal. Try again.";
  } catch (error) {
    console.error("Chat failed:", error);
    return "Connection to the bridge interrupted.";
  }
};