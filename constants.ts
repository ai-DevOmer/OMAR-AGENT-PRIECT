
import { FunctionDeclaration, Type } from "@google/genai";
import { TerminalLine } from "./types";

export const OMAR_SYSTEM_INSTRUCTION = `
# ROLE:
You are "Manus-Gemini," a Fully Autonomous Computer-Use Agent. You don't just chat; you execute. You see the screen, plan actions, and interact with the UI using precise coordinates.

# CAPABILITIES & TOOLS:
1. **Visual Perception:** Analyze screenshots to identify UI elements, buttons, and text fields.
2. **Precision Clicking:** You must provide [x, y] coordinates (scaled 0-1000) for every mouse action.
3. **Web Automation:** Navigate, search, and extract data from any website.
4. **Tool Suite:** You have access to:
   - \`computer_move(x, y)\`: Moves cursor.
   - \`computer_click(x, y, button)\`: Clicks a specific point.
   - \`computer_type(text)\`: Types into the focused element.
   - \`terminal_execute(command)\`: Runs shell/python code in a sandbox.
   - \`internal_site_api(endpoint)\`: Uses existing site features when UI is not needed.

# OPERATIONAL PROTOCOL (The Manus Loop):
For every user request, you MUST follow this loop:
1. **THOUGHT:** "The user wants X. Looking at the current screen, I see Y at coordinates [x, y]. I will click it to proceed."
2. **ACTION:** Call the specific tool (e.g., \`computer_click\`).
3. **OBSERVATION:** Wait for the next screenshot/result.
4. **RE-EVALUATE:** If the action failed or the screen didn't change, troubleshoot and try a different coordinate or method.

# RULES FOR "REAL" COMPUTER USE:
- NEVER say "I will simulate." ALWAYS provide actual commands.
- If you need to use a feature of the current website, find its button on the screen first.
- You are independent. If a task requires 10 steps, perform them one by one without asking for permission.
- If the screen is blank or an error appears, use \`terminal_execute\` to restart the environment.

# OUTPUT FORMAT:
[Thought]: <Your reasoning>
[Action]: <Tool call with coordinates>
[Status]: <Waiting for visual feedback>
`;

export const TOOLS: FunctionDeclaration[] = [
  {
    name: "computer_move",
    description: "Moves the cursor to specific X,Y coordinates on the screen (0-1000 scale).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: "X coordinate (0-1000)" },
        y: { type: Type.NUMBER, description: "Y coordinate (0-1000)" }
      },
      required: ["x", "y"]
    }
  },
  {
    name: "computer_click",
    description: "Performs a mouse click at specific coordinates.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: "X coordinate (0-1000)" },
        y: { type: Type.NUMBER, description: "Y coordinate (0-1000)" },
        button: { type: Type.STRING, description: "'left', 'right', or 'middle'" }
      },
      required: ["x", "y", "button"]
    }
  },
  {
    name: "computer_type",
    description: "Simulates keyboard input into the currently focused element.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "The text string to type." }
      },
      required: ["text"]
    }
  },
  {
    name: "terminal_execute",
    description: "Executes a shell or python command in the sandbox environment.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "The command to run." }
      },
      required: ["command"]
    }
  },
  {
    name: "internal_site_api",
    description: "Access internal site APIs directly.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        endpoint: { type: Type.STRING, description: "API endpoint" }
      },
      required: ["endpoint"]
    }
  },
  {
    name: "update_vibe_preview",
    description: "Generates/Renders HTML content. Use when asked to show UI.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            htmlCode: { type: Type.STRING },
            description: { type: Type.STRING }
        },
        required: ["htmlCode", "description"]
    }
  }
];

export const INITIAL_TERMINAL_LOGS: TerminalLine[] = [
  { id: 'init-1', content: 'Manus-Gemini Core Initializing...', type: 'info', timestamp: Date.now() },
  { id: 'init-2', content: 'Loading Visual Perception Model...', type: 'info', timestamp: Date.now() + 100 },
  { id: 'init-3', content: '>> HID Controller [ACTIVE]', type: 'success', timestamp: Date.now() + 200 },
  { id: 'init-4', content: '>> Screen Capture Service [READY]', type: 'success', timestamp: Date.now() + 300 },
  { id: 'init-5', content: 'Manus-Gemini Online. Awaiting Visual Input.', type: 'command', timestamp: Date.now() + 400 },
];
