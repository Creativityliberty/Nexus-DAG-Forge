
import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus, SubTask } from "../types";

const stripMarkdown = (text: string) => {
  return text.replace(/```json\n?|```/g, "").trim();
};

export const generateWorkflow = async (prompt: string): Promise<Task[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a world-class systems architect and DevOps engineer. 
    Create a professional Directed Acyclic Graph (DAG) for: "${prompt}".
    
    Requirements:
    - 6-10 logical nodes.
    - Each node needs 3-5 granular subtasks (morsels).
    - Strategic priorities (LOW, MEDIUM, HIGH).
    - Clear dependencies (use the node IDs).
    - Tech-heavy titles and descriptions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            status: { type: Type.STRING, enum: Object.values(TaskStatus) },
            dependencies: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            owner: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ["id", "title", "completed"]
              }
            }
          },
          required: ["id", "title", "description", "status", "dependencies", "priority", "subtasks"],
          propertyOrdering: ["id", "title", "description", "status", "dependencies", "priority", "subtasks"]
        }
      }
    }
  });

  try {
    const text = stripMarkdown(response.text || '[]');
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI workflow response:", e);
    return [];
  }
};

export const enhanceTask = async (partialTask: Partial<Task>): Promise<Partial<Task>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `You are a technical assistant. Enhance this task specification.
  Current Context:
  Title: ${partialTask.title || 'Untitled'}
  Description: ${partialTask.description || 'N/A'}
  
  Provide a highly professional technical title, a deep technical objective, a logical priority (LOW/MEDIUM/HIGH), 
  and exactly 4 logical sub-steps (morsels) that would be required to complete this task.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          subtasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                completed: { type: Type.BOOLEAN }
              }
            }
          }
        },
        required: ["title", "description", "priority", "subtasks"]
      }
    }
  });

  try {
    const text = stripMarkdown(response.text || '{}');
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI enhancement response:", e);
    return partialTask;
  }
};

export const generateSubtasks = async (task: Task): Promise<SubTask[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate 4-6 granular, technical sub-steps for this task: "${task.title}".
    Task Description: ${task.description}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            completed: { type: Type.BOOLEAN }
          },
          required: ["id", "title", "completed"]
        }
      }
    }
  });

  try {
    const text = stripMarkdown(response.text || '[]');
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to generate subtasks:", e);
    return [];
  }
};

// NEW FUNCTION: Chat with a specific node context
export const chatWithNode = async (task: Task, userMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      { role: 'user', parts: [{ text: `You are ${task.owner || 'System_Automaton'}, the owner of the node "${task.title}". Task ID: ${task.id}. Status: ${task.status}. Description: ${task.description}. Act as a hyper-intelligent, technical system agent.` }] },
      { role: 'model', parts: [{ text: "Context loaded. Awaiting input." }] },
      { role: 'user', parts: [{ text: userMessage }] }
    ]
  });
  // Added fallback for response.text as it is string | undefined
  return response.text || "Communication relay failure. Node context lost.";
};
