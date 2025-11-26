import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

// Safety check for API key
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuizFromTopic = async (topic: string, count: number = 3): Promise<Question[]> => {
  const ai = getClient();
  
  const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}".
  For each question, provide:
  - The question text
  - 4 options
  - The index (0-3) of the correct answer
  `;

  // Define schema for structured output
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        correctAnswerIndex: { type: Type.INTEGER },
      },
      required: ["text", "options", "correctAnswerIndex"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawQuestions = JSON.parse(text);
    
    // Map to our internal ID structure
    return rawQuestions.map((q: any, idx: number) => ({
      id: `gen_${Date.now()}_${idx}`,
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
    }));
  } catch (error) {
    console.error("Gemini generation error:", error);
    return [];
  }
};

export const explainConcept = async (query: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Explain the following concept simply for a student: ${query}`,
    });
    return response.text || "Sorry, I couldn't generate an explanation.";
  } catch (error) {
    console.error("Gemini explanation error:", error);
    return "Error connecting to AI tutor.";
  }
};
