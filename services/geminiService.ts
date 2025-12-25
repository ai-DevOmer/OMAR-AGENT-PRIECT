
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { OMAR_SYSTEM_INSTRUCTION, TOOLS } from "../constants";
import { Message, Attachment } from "../types";

let geminiClient: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.error("Gemini initialization failed: API_KEY not found in environment.");
  }
};

export const startChat = async () => {
  if (!geminiClient) initializeGemini();
  if (!geminiClient) throw new Error("Gemini not initialized");
  
  // Enable Native Tools here
  chatSession = geminiClient.chats.create({
    model: 'gemini-2.5-flash', 
    config: {
      systemInstruction: OMAR_SYSTEM_INSTRUCTION,
      tools: [
        { googleSearch: {} },   // Enable Real Google Search (Research/Web Auto)
        { codeExecution: {} },  // Enable Real Python Execution (Data/Dev)
        { functionDeclarations: TOOLS } // Our custom UI tool (Content/Dashboards)
      ]
    }
  });
};

const fileToPart = async (attachment: Attachment) => {
    return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: attachment.file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(attachment.file);
    });
};

export const sendMessageToGemini = async (
  message: string, 
  previousMessages: Message[],
  attachments: Attachment[] = []
): Promise<GenerateContentResponse> => {
  if (!geminiClient || !chatSession) {
    await startChat();
  }

  try {
      // Construct parts: Text + Attachments
      const parts: any[] = [{ text: message }];
      
      if (attachments.length > 0) {
          const fileParts = await Promise.all(attachments.map(fileToPart));
          parts.push(...fileParts);
      }

      const response = await chatSession!.sendMessage({ 
          message: parts 
      });
      return response;
  } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
  }
};

export const sendToolResponse = async (
  toolCalls: any[], 
  toolOutputs: any[]
): Promise<GenerateContentResponse> => {
    if (!chatSession) throw new Error("No active chat session");

    const parts = toolCalls.map((call, index) => {
        const id = call.id || `unknown-id-${index}`;
        const name = call.name || 'unknown_tool';
        const result = toolOutputs[index] !== undefined ? toolOutputs[index] : "No output";

        return {
            functionResponse: {
                id: id,
                name: name,
                response: { result: result }
            }
        };
    });

    return await chatSession.sendMessage({
        message: parts
    });
};
