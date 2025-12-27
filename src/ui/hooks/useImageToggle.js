import { useAtom } from "jotai";

import { imageToggleAtom } from "../atoms/imageToggleAtom";

export const useImageToggle = () => {
  const [isImageToggle, setIsImageToggle] = useAtom(imageToggleAtom);
  return {
    isImageToggle,
    setIsImageToggle,
  };
};
