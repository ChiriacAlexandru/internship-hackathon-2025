import { runRuleChecks } from "../services/ruleEngine.js";
import { runReviewWithModel } from "../services/ollamaSvc.js";
import { recordUsageMetrics } from "../services/costTracker.js";
import { persistReviewSession } from "../services/reviewPersistence.js";
import axios from "axios";
import { findReviewById } from "../models/reviewModel.js";
import pool from "../db/pool.js";

export const handleCreateReview = async (req, res, next) => {
  try {
    const { files = [], metadata = {} } = req.body ?? {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error:
          "Payload must include a non-empty `files` array with {path, content}.",
      });
    }

    const ruleFindings = await runRuleChecks(files, {
      projectId: metadata.projectId,
    });
    const { findings: modelFindings, usage } = await runReviewWithModel(
      files,
      metadata
    );

    recordUsageMetrics(usage);

    const combinedFindings = [...ruleFindings, ...modelFindings];

    const persisted = await persistReviewSession({
      metadata,
      files,
      findings: combinedFindings,
      usage,
    });

    res.status(201).json({
      review: {
        id: persisted?.id,
        metadata,
        findings: combinedFindings,
        usage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleQuickCheck = async (req, res, next) => {
  try {
    const { files = [], projectId } = req.body ?? {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error:
          "Payload must include a non-empty `files` array with {path, content}.",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        error: "projectId is required for quick check.",
      });
    }

    const ruleFindings = await runRuleChecks(files, { projectId });

    const passed = ruleFindings.length === 0;

    res.json({
      passed,
      violations: ruleFindings,
      message: passed
        ? "All mandatory rules passed!"
        : `Found ${ruleFindings.length} violation${
            ruleFindings.length > 1 ? "s" : ""
          }.`,
    });
  } catch (error) {
    next(error);
  }
};

export const handleChatWithAI = async (req, res, next) => {
  try {
    const { reviewId, message, context = {} } = req.body ?? {};

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string.",
      });
    }

    // Build context from review findings if reviewId provided
    let contextText = "";
    if (reviewId) {
      const review = await findReviewById(reviewId);
      if (review) {
        // Get findings for this review
        const { rows: findings } = await pool.query(
          `SELECT file, line_start, line_end, category, severity, title, 
                  explanation, recommendation, source
           FROM findings 
           WHERE review_id = $1 
           ORDER BY severity DESC, file, line_start`,
          [reviewId]
        );

        if (findings.length > 0) {
          contextText = `\n\nContext - Code Review Findings:\n${findings
            .map(
              (f, i) =>
                `${i + 1}. [${f.severity?.toUpperCase()}] ${f.title} (${
                  f.file
                }:${f.line_start}-${f.line_end})\n   ${
                  f.explanation
                }\n   Recommendation: ${f.recommendation}`
            )
            .join("\n\n")}`;
        }
      }
    }

    // Add any additional context from request
    if (context.projectId || context.files) {
      contextText += `\n\nAdditional Context: ${JSON.stringify(
        context,
        null,
        2
      )}`;
    }

    // Build prompt for Ollama
    const OLLAMA_URL =
      process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
    // Use a potentially faster model for chat if specified, otherwise use the main model
    const MODEL =
      process.env.OLLAMA_CHAT_MODEL ||
      process.env.OLLAMA_MODEL ||
      process.env.LLM_MODEL ||
      "deepseek-coder";

    const messages = [
      {
        role: "system",
        content:
          "You are an AI code review assistant. Answer questions about code quality, best practices, and provide helpful recommendations. Be concise but thorough. If you have access to code review findings, reference them when relevant.",
      },
      {
        role: "user",
        content: `${message}${contextText}`,
      },
    ];

    // Check if we should bypass Ollama
    if (process.env.BYPASS_OLLAMA === "true") {
      return res.json({
        response: `[Mock Response] I understand your question: "${message}". However, BYPASS_OLLAMA is enabled. Set BYPASS_OLLAMA=false to get real AI responses.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Call Ollama
    const start = Date.now();
    const ollamaResponse = await axios.post(
      OLLAMA_URL,
      {
        model: MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500, // Limit response length for faster replies
        },
      },
      {
        timeout: Number(process.env.OLLAMA_TIMEOUT_MS ?? 120000), // Increased default to 2 minutes
      }
    );

    const latency_ms = Date.now() - start;
    const aiResponse =
      ollamaResponse?.data?.message?.content ?? "No response from AI model.";

    // Record usage if reviewId provided
    if (reviewId) {
      recordUsageMetrics({
        provider: "ollama",
        model: MODEL,
        chars_in: JSON.stringify(messages).length,
        chars_out: aiResponse.length,
        latency_ms,
      });
    }

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat with AI failed:", error.message);
    console.error("Error details:", error);

    // Return helpful error message
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "AI service unavailable",
        message:
          "Could not connect to Ollama. Make sure it is running at " +
          (process.env.OLLAMA_URL || "http://localhost:11434"),
      });
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "Request timeout",
        message:
          "Ollama took too long to respond. Try again or increase OLLAMA_TIMEOUT_MS.",
      });
    }

    // Return generic error with details for debugging
    return res.status(500).json({
      error: "Chat failed",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
