
import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const stripMarkdown = (text: string) => {
  return text.replace(/```json\n?|```/g, "").trim();
};

export const generateWorkflow = async (prompt: string): Promise<Task[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a world-class Lead Orchestrator Architect. Your task is to design a high-performance Directed Acyclic Graph (DAG) for the following infrastructure request: "${prompt}".
    
    Requirements:
    - 6 to 10 logical nodes.
    - Each node must have an owner (agent style: Security_Kernel, Logic_Unit, DevOps_Stream, etc).
    - Clear and logical dependencies (don't create circular links).
    - 3 to 5 granular subtasks per node.
    - Professional, punchy titles and technical descriptions.
    - Strategic priorities (LOW, MEDIUM, HIGH).`,
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
            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
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
          required: ["id", "title", "description", "status", "dependencies", "priority", "subtasks"]
        }
      }
    }
  });

  try {
    const text = response.text || '[]';
    return JSON.parse(stripMarkdown(text));
  } catch (e) {
    console.error("Workflow parsing error:", e);
    return [];
  }
};

export const optimizeWorkflow = async (tasks: Task[]): Promise<Task[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this DAG workflow and optimize it for maximum parallelism and efficiency.
    You can:
    - Re-order dependencies to reduce bottlenecks.
    - Refine priorities based on dependency chains.
    - Optimize node titles and descriptions for technical clarity.
    
    Current Workflow: ${JSON.stringify(tasks)}`,
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
            status: { type: Type.STRING },
            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            owner: { type: Type.STRING },
            priority: { type: Type.STRING },
            subtasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, completed: { type: Type.BOOLEAN } } } }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(stripMarkdown(response.text || '[]'));
  } catch (e) {
    return tasks;
  }
};

export const generateMissionReport = async (tasks: Task[], prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Provide an executive summary and architectural analysis of the following workflow designed for: "${prompt}".
    Analyze:
    1. Critical path nodes.
    2. Dependency health.
    3. Potential resource bottlenecks.
    Workflow: ${JSON.stringify(tasks)}
    Use professional markdown formatting.`,
  });
  return response.text || "Report generation failed.";
};

export const generateNodeDocs = async (task: Task): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate professional technical documentation for this orchestration node:
    Node ID: ${task.id}
    Title: ${task.title}
    Spec: ${task.description}
    Priority: ${task.priority}
    Subtasks: ${JSON.stringify(task.subtasks)}
    
    Format as Markdown with sections for 'Architecture', 'Operational Procedure', and 'Risk Assessment'.`,
  });
  return response.text || "Documentation failure.";
};

export const chatWithNode = async (task: Task, userMessage: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { role: 'user', parts: [{ text: `You are the specialized AI agent: "${task.owner || 'Nexus_Automaton'}". You own the system node: "${task.title}" (Status: ${task.status}).
      Objective: Answer technical questions or process instructions related to this node. Be concise, professional, and technical.` }] },
      { role: 'model', parts: [{ text: "Synthesizer online. Ready to assist with node operations." }] },
      { role: 'user', parts: [{ text: userMessage }] }
    ]
  });
  return response.text || "Transmission interrupted.";
};

export const quickRefine = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Professionalize this technical text to be more concise and punchy: "${text}". Return only the refined text.`,
  });
  return response.text?.trim() || text;
};
