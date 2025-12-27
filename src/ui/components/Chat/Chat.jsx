import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Command, CornerDownLeft } from "lucide-react";
import styled from "styled-components";
import Button from "../../primitives/Button";
import { usePopover } from "../../hooks/usePopover";
import { useChat } from "../../hooks/useChat";
import { useAnswer } from "../../hooks/useAnswer";
import { openaiChatStream } from "../../ai-utils/openai";
import StepRenderer from "./StepRenderer";
import { STEPS } from "../../atoms/chatAtom";
import { useAbortController } from "../../hooks/useAbortController";
import { electronAPI } from "../../utils";
import { useAPIKey } from "../../hooks/useApiKey";
import { resetConversation } from "../../atoms/conversationHistoryAtom";
import { useImageToggle } from "../../hooks/useImageToggle";

const getNextStep = (currentStep) => {
  switch (currentStep) {
    case STEPS.INPUT:
      return STEPS.ANSWER;
    case STEPS.ANSWER:
      return STEPS.FOLLOWUP;
    case STEPS.FOLLOWUP:
      return STEPS.ANSWER;
    default:
      return STEPS.INPUT;
  }
};

const Chat = () => {
  const { isOpen, toggle, isOpenRef } = usePopover(2);
  const { chatStep, setChatStep, chatStepRef } = useChat();
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0 });
  const { setAnswer, setIsLoading, setError, setLastQuery } = useAnswer();
  const { createNewController, reset, abort } = useAbortController();
  const { isImageToggle } = useImageToggle();
  const { apiKey } = useAPIKey();

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const { bottom } = buttonRef.current.getBoundingClientRect();
      setCoords({ top: bottom + 15 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleShortcut = (accelerator) => {
      if (accelerator !== "CMD_ENTER") return;
      if (!isOpenRef.current) {
        toggle();
      } else {
        if (chatStepRef.current === STEPS.INPUT) toggle();
        else setChatStep((prev) => getNextStep(prev));
      }
    };
    electronAPI.onKeyBoardShortcut(handleShortcut);
  }, []);

  const handleButtonClick = () => {
    if (!isOpenRef.current) {
      toggle();
    } else {
      if (chatStep === STEPS.INPUT) toggle();
      else setChatStep((prev) => getNextStep(prev));
    }
  };

  const makeQuery = async (query) => {
    if (query === "reset") {
      abort();
      reset();
      setAnswer("");
      setIsLoading(false);
      setError(null);
      setLastQuery("");
      setChatStep(STEPS.INPUT);
      resetConversation();
      return;
    }

    const controller = createNewController();
    setLastQuery(query);
    setIsLoading(true);
    setAnswer("");
    setError(null);

    if (!apiKey) {
      setAnswer("");
      setIsLoading(false);
      setError("API key was not provided");
      reset();
      return;
    }

    const hasPermission = await electronAPI.checkScreenPermission();

    if (!hasPermission) {
      setAnswer("");
      setIsLoading(false);
      setError("Please provide screen capture permission to cogni");
      reset();
      return;
    }

    openaiChatStream({
      apiKey,
      userMessage: query,
      signal: controller.signal,
      onChunk: (chunk) => setAnswer((prev) => prev + chunk),
      onFinish: () => {
        setIsLoading(false);
        reset();
      },
      onError: (error) => {
        setAnswer("");
        setIsLoading(false);
        setError(error);
        reset();
      },
      useImage: isImageToggle,
    });
  };

  return (
    <>
      <div ref={buttonRef}>
        <Button onClick={handleButtonClick}>
          <ButtonContent>
            <span>Ask</span>
            <ShortcutGroup>
              <ShortcutKey>
                <Command size={9} />
              </ShortcutKey>
              <ShortcutKey>
                <CornerDownLeft size={9} />
              </ShortcutKey>
            </ShortcutGroup>
          </ButtonContent>
        </Button>
      </div>
      {isOpen &&
        ReactDOM.createPortal(
          <StepRenderer close={close} coords={coords} makeQuery={makeQuery} />,
          document.getElementById("root-portal")
        )}
    </>
  );
};

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ShortcutGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const ShortcutKey = styled.div`
  background: #2a2a2a;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default Chat;
