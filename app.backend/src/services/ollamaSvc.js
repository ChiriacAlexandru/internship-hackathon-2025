import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const MODEL =
  process.env.OLLAMA_MODEL || process.env.LLM_MODEL || "deepseek-coder";

const buildPrompt = (files, metadata) => {
  const fileDump = files
    .map(
      ({ path, content = "" }) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``
    )
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are an AI code reviewer. You MUST respond with ONLY a valid JSON array, no markdown, no explanations, no extra text.

The JSON array should contain code review findings. Each finding object must have these exact fields:
{
  "file": "string - filename",
  "line_start": number,
  "line_end": number,
  "category": "string - one of: security, performance, maintainability, quality, style",
  "severity": "string - one of: critical, high, medium, low",
  "title": "string - short summary",
  "explanation": "string - detailed explanation",
  "recommendation": "string - how to fix",
  "effort_minutes": number
}

If the code is perfect, return an empty array: []

CRITICAL: Return ONLY valid JSON. No markdown code blocks, no "Here's the analysis:", just the JSON array.`,
    },
    {
      role: "user",
      content: `Review the following code and return ONLY a JSON array of findings:\n\n${fileDump}\n\nMetadata: ${JSON.stringify(
        metadata
      )}`,
    },
  ];
};

const parseResponse = (rawResponse) => {
  console.log("=== RAW OLLAMA RESPONSE ===");
  console.log(rawResponse);
  console.log("=== END RAW RESPONSE ===");

  try {
    // Try direct parse first
    const parsed = JSON.parse(rawResponse);

    // If it's already an array, return it
    if (Array.isArray(parsed)) {
      return parsed;
    }

    // If it's a single object, wrap it in an array
    if (parsed && typeof parsed === "object") {
      console.log("Response is a single object, wrapping in array");
      return [parsed];
    }

    console.warn("Parsed response is neither array nor object:", parsed);
  } catch (error) {
    console.warn("Direct JSON parse failed:", error.message);

    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = rawResponse.match(
      /```(?:json)?\s*(\[[\s\S]*?\])\s*```/
    );
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        if (Array.isArray(parsed)) {
          console.log(
            "Successfully extracted JSON array from markdown code block"
          );
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to parse extracted code block:", e.message);
      }
    }

    // Try to extract single object from markdown code blocks
    const objectBlockMatch = rawResponse.match(
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
    );
    if (objectBlockMatch) {
      try {
        const parsed = JSON.parse(objectBlockMatch[1]);
        if (parsed && typeof parsed === "object") {
          console.log(
            "Successfully extracted JSON object from markdown code block"
          );
          return [parsed];
        }
      } catch (e) {
        console.warn("Failed to parse extracted object block:", e.message);
      }
    }

    // Try to find JSON array anywhere in the response
    const arrayMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          console.log("Successfully extracted JSON array from response");
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to parse extracted array:", e.message);
      }
    }

    // Try to find JSON object anywhere in the response
    const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        if (parsed && typeof parsed === "object") {
          console.log("Successfully extracted JSON object from response");
          return [parsed];
        }
      } catch (e) {
        console.warn("Failed to parse extracted object:", e.message);
      }
    }
  }

  console.error("All parsing attempts failed. Returning fallback finding.");
  return [
    {
      file: "unknown",
      line_start: 1,
      line_end: 1,
      category: "maintainability",
      severity: "low",
      title: "Unable to parse model output",
      explanation:
        "The AI response was not valid JSON; returning fallback finding.",
      recommendation: "Check the backend logs for the raw model response.",
      effort_minutes: 1,
    },
  ];
};

export const runReviewWithModel = async (files = [], metadata = {}) => {
  if (process.env.BYPASS_OLLAMA === "true") {
    return {
      findings: [
        {
          file: files[0]?.path ?? "unknown",
          line_start: 1,
          line_end: 1,
          category: "quality",
          severity: "medium",
          title: "Mock AI finding",
          explanation: "Set BYPASS_OLLAMA=false to use the real model.",
          recommendation:
            "Verify the DeepSeek model installation and restart the backend.",
          effort_minutes: 5,
        },
      ],
      usage: {
        provider: "mock",
        model: process.env.OLLAMA_MODEL || MODEL,
        chars_in: JSON.stringify(files).length,
        chars_out: 0,
        latency_ms: 0,
      },
    };
  }

  try {
    const start = Date.now();

    const response = await axios.post(
      OLLAMA_URL,
      {
        model: MODEL,
        messages: buildPrompt(files, metadata),
        format: "json",
        stream: false,
      },
      {
        timeout: Number(process.env.OLLAMA_TIMEOUT_MS ?? 60000),
      }
    );

    const latency_ms = Date.now() - start;
    const raw = response?.data?.message?.content ?? "[]";
    const findings = parseResponse(raw);

    return {
      findings,
      usage: {
        provider: "ollama",
        model: MODEL,
        chars_in: JSON.stringify(response?.config?.data ?? {}).length,
        chars_out: raw.length,
        latency_ms,
      },
    };
  } catch (error) {
    console.error("Ollama call failed:", error.message);

    return {
      findings: [
        {
          file: files[0]?.path ?? "unknown",
          line_start: 1,
          line_end: 1,
          category: "system",
          severity: "high",
          title: "Ollama request failed",
          explanation: error.message,
          recommendation:
            "Ensure Ollama is running and reachable at OLLAMA_URL. You can set BYPASS_OLLAMA=true during development.",
          effort_minutes: 2,
        },
      ],
      usage: {
        provider: "ollama",
        model: MODEL,
        chars_in: JSON.stringify(files).length,
        chars_out: 0,
        latency_ms: 0,
      },
    };
  }
};
