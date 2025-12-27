import { createOpenAI } from "@ai-sdk/openai";
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

export async function openaiChatStream({
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

    const openai = createOpenAI({ apiKey });

    const { textStream, fullStream } = streamText({
      model: openai("gpt-4-turbo"),
      messages: getConversationHistory(),
      onError: () => {
        onError?.(
          "Error fetching data. Please verify your API key is correct and try again."
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
