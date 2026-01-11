import Button from "../primitives/Button";
import styled from "styled-components";
import { AudioLines } from "lucide-react";
import ReactDOM from "react-dom";

import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";
import { ResultReason } from "microsoft-cognitiveservices-speech-sdk";
import { useRecording } from "../hooks/useRecording";
import { electronAPI } from "../utils";
import { useMouseForwarding } from "../hooks/useMouseForwarding";
import { useEffect, useRef, useState } from "react";
import { usePopover } from "../hooks/usePopover";
import { useChat } from "../hooks/useChat";
import { STEPS } from "../atoms/chatAtom";

const AudioDisplay = ({ coords, streamingText }) => {
  const containerRef = useMouseForwarding();
  const { setIsRecording } = useRecording();

  useEffect(() => {
    return () => {
      setIsRecording(false);
    };
  }, []);

  return (
    <Container ref={containerRef} top={coords.top}>
      <DisplayContainer>
        {streamingText ? streamingText : "Listening..."}
      </DisplayContainer>
    </Container>
  );
};

const Audio = () => {
  const { isRecording, setIsRecording } = useRecording();
  const [streamingText, setStreamingText] = useState("");
  const { setGlobalInputValue } = useChat();

  const { isOpen, toggle } = usePopover(4);
  const { toggle: toggleChatBox } = usePopover(2);
  const [coords, setCoords] = useState({ top: 0 });
  const { setChatStep } = useChat();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const { bottom } = buttonRef.current.getBoundingClientRect();
      setCoords({ top: bottom + 15 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleShortcut = (accelerator) => {
      if (accelerator === "CMD_L") {
        startRecording();
      }
    };
    electronAPI.onKeyBoardShortcut(handleShortcut);
  }, []);

  const startRecording = async () => {
    if (isRecording) return;
    toggle();
    setStreamingText("");
    const STT_API_KEY = await electronAPI.getSttApiKey();
    setIsRecording(true);

    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      const speechConfig = speechsdk.SpeechConfig.fromSubscription(
        STT_API_KEY,
        "eastus"
      );

      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new speechsdk.SpeechRecognizer(
        speechConfig,
        audioConfig
      );

      recognizer.recognizing = async (s, e) => {
        setStreamingText(e.result.text);
      };

      recognizer.recognizeOnceAsync((result) => {
        setIsRecording(false);
        if (result.reason === ResultReason.RecognizedSpeech) {
          const text = result.text;
          if (text) {
            setGlobalInputValue(text);
            setChatStep(STEPS.INPUT);
            toggle();
            toggleChatBox();
          }
        }
      });
    });
  };

  return (
    <>
      <ButtonContainer ref={buttonRef}>
        <SolidButton disabled={isRecording} onClick={startRecording}>
          <ButtonContent>
            <span>{isRecording ? "Listening" : "Listen"}</span>
            <ShortcutGroup>
              <AudioLines size={14} />
            </ShortcutGroup>
          </ButtonContent>
        </SolidButton>
      </ButtonContainer>
      {isOpen &&
        ReactDOM.createPortal(
          <AudioDisplay coords={coords} streamingText={streamingText} />,
          document.getElementById("root-portal")
        )}
    </>
  );
};

const Container = styled.div`
  position: fixed;
  top: ${({ top }) => top}px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px;
  border-radius: 8px;
  z-index: 9999;
  border: 1px solid #3a3a3a;
  display: flex;
  align-items: center;
  width: 600px;
`;

const DisplayContainer = styled.div`
  flex-grow: 1;
  background: transparent;
  min-height: 20px;
  border: none;
  padding: 4px;
  font-size: 0.75rem;
  line-height: 18px;
  color: white;
  &::placeholder {
    color: grey;
    font-weight: semibold;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
`;

const SolidButton = styled(Button)`
  background-color: rgba(74, 74, 74, 0.6);
  border-radius: 444444px;

  &:hover {
    background-color: rgba(74, 74, 74, 0.3);
  }
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ShortcutGroup = styled.div`
  display: flex;
  align-items: center;
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

export default Audio;
