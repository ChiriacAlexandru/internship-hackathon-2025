import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const MODEL =
  process.env.OLLAMA_MODEL ||
  process.env.LLM_MODEL ||
  'deepseek-coder';

const buildPrompt = (files, metadata) => {
  const fileDump = files
    .map(({ path, content = '' }) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');

  return [
    {
      role: 'system',
      content:
        'You are an AI code reviewer. Return a JSON array with findings, each containing file, line_start, line_end, category, severity, title, explanation, recommendation, effort_minutes.',
    },
    {
      role: 'user',
      content: `Review the following code:\n\n${fileDump}\n\nMetadata: ${JSON.stringify(metadata)}`,
    },
  ];
};

const parseResponse = (rawResponse) => {
  try {
    const parsed = JSON.parse(rawResponse);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // fall through to mock fallback
  }

  return [
    {
      file: 'unknown',
      line_start: 1,
      line_end: 1,
      category: 'maintainability',
      severity: 'low',
      title: 'Unable to parse model output',
      explanation: 'The AI response was not valid JSON; returning fallback finding.',
      recommendation: 'Check the backend logs for the raw model response.',
      effort_minutes: 1,
    },
  ];
};

export const runReviewWithModel = async (files = [], metadata = {}) => {
  if (process.env.BYPASS_OLLAMA === 'true') {
    return {
      findings: [
        {
          file: files[0]?.path ?? 'unknown',
          line_start: 1,
          line_end: 1,
          category: 'quality',
          severity: 'medium',
          title: 'Mock AI finding',
          explanation: 'Set BYPASS_OLLAMA=false to use the real model.',
          recommendation: 'Verify the DeepSeek model installation and restart the backend.',
          effort_minutes: 5,
        },
      ],
      usage: {
        provider: 'mock',
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
        format: 'json',
        stream: false,
      },
      {
        timeout: Number(process.env.OLLAMA_TIMEOUT_MS ?? 60000),
      },
    );

    const latency_ms = Date.now() - start;
    const raw = response?.data?.message?.content ?? '[]';
    const findings = parseResponse(raw);

    return {
      findings,
      usage: {
        provider: 'ollama',
        model: MODEL,
        chars_in: JSON.stringify(response?.config?.data ?? {}).length,
        chars_out: raw.length,
        latency_ms,
      },
    };
  } catch (error) {
    console.error('Ollama call failed:', error.message);

    return {
      findings: [
        {
          file: files[0]?.path ?? 'unknown',
          line_start: 1,
          line_end: 1,
          category: 'system',
          severity: 'high',
          title: 'Ollama request failed',
          explanation: error.message,
          recommendation:
            'Ensure Ollama is running and reachable at OLLAMA_URL. You can set BYPASS_OLLAMA=true during development.',
          effort_minutes: 2,
        },
      ],
      usage: {
        provider: 'ollama',
        model: MODEL,
        chars_in: JSON.stringify(files).length,
        chars_out: 0,
        latency_ms: 0,
      },
    };
  }
};
