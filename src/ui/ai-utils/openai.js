import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { electronAPI } from "../utils";

import {
  addUserMessage,
  addAssistantMessage,
  getConversationHistory,
} from "../atoms/conversationHistoryAtom";

const takeScreenshot = async () => {
  return await electronAPI.takeScreenshot();
};

export async function claudeChatStream({
  userMessage,
  onChunk,
  onFinish,
  onError,
  signal,
  apiKey,
  useImage,
}) {
  try {
    let image = null;

    if (useImage) {
      image = await takeScreenshot();
    }

    addUserMessage(userMessage, image);

    const anthropic = createAnthropic({
      apiKey,
      headers: { "anthropic-dangerous-direct-browser-access": "true" },
    });

    const { textStream, fullStream } = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      messages: getConversationHistory(),
      onError: () => {
        onError?.(
          "Error fetching data. Please verify your API key is correct and try again.",
        );
      },
    });

    let assistantReply = "";

    (async () => {
      try {
        for await (const chunk of textStream) {
          if (signal?.aborted) break;
          assistantReply += chunk;
          onChunk?.(chunk);
        }
        if (!signal?.aborted) {
          addAssistantMessage(assistantReply);
          onFinish?.();
        }
      } catch (err) {
        if (!signal?.aborted) {
          onError?.(err || "Error fetching data.");
        }
      }
    })();

    return fullStream;
  } catch (err) {
    onError?.(err?.message || "Unexpected error occurred.");
  }
}
