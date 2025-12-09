import { GoogleGenAI } from "@google/genai";
import { SimulationState, Gear } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainMechanics = async (
  topic: string,
  state: SimulationState
): Promise<string> => {
  try {
    const prompt = `
      You are an expert automotive engineering instructor. The user is using a manual transmission simulator.
      
      Current Simulation State:
      - Engine Status: ${state.engineOn ? "Running" : "Off"}
      - RPM: ${Math.round(state.rpm)}
      - Speed: ${Math.round(state.speed)} km/h
      - Gear: ${state.gear}
      - Clutch Pedal: ${Math.round(state.clutchPedal * 100)}% pressed (100% means engine disconnected from wheels)
      - Stalled: ${state.isStalled ? "YES" : "No"}

      User Question/Context: "${topic}"

      Explain the physics and mechanics concisely (max 3 sentences). 
      Focus on how the engine (power source), clutch (coupling), and transmission (torque multiplication) are interacting right now.
      Use simple analogies. Output in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful mechanical engineering tutor. Keep explanations technical but accessible.",
      }
    });

    return response.text || "AI 正在思考...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "无法获取 AI 解释，请检查网络设置。";
  }
};
