import { useAtom } from "jotai";
import { isRecordingAtom } from "../atoms/recordingAtom";

export const useRecording = () => {
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  return {
    isRecording,
    setIsRecording,
  };
};
