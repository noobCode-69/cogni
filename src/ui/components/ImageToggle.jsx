import Button from "../primitives/Button";
import { Command } from "lucide-react";
import styled from "styled-components";
import { useImageToggle } from "../hooks/useImageToggle";
import { useEffect } from "react";

const ImageToggle = () => {
  const { isImageToggle, setIsImageToggle } = useImageToggle();

  useEffect(() => {
    const handleShortcut = (accelerator) => {
      if (accelerator === "CMD_I") {
        setIsImageToggle(!isImageToggle);
      }
    };
    electronAPI.onKeyBoardShortcut(handleShortcut);
  }, [isImageToggle]);

  const handleToggle = () => {
    setIsImageToggle(!isImageToggle);
  };

  return (
    <SolidButton active={isImageToggle} onClick={handleToggle}>
      <ButtonContent>
        <span>Toggle Image </span>
        <ShortcutGroup>
          <ShortcutKey>
            <Command size={9} />
          </ShortcutKey>
          <ShortcutKey
            style={{
              transform: "rotateY(180deg)",
            }}
          >
            I
          </ShortcutKey>
        </ShortcutGroup>
      </ButtonContent>
    </SolidButton>
  );
};

const SolidButton = styled(Button)`
  background-color: ${({ active }) =>
    active ? "rgba(74, 74, 74, 0.6);" : "transparent"};
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

export default ImageToggle;
