import styled from "styled-components";
import type { FormEvent, KeyboardEvent } from "react";
import { Theme } from "../../config/theme";
import {
  useStreamingActions,
  useStreamingState,
} from "../../lib/generative/context";

interface ChatInputFooterProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ChatInputFooter({
  inputValue,
  onInputChange,
  onSubmit,
}: ChatInputFooterProps) {
  const { isStreaming, streamError } = useStreamingState();
  const { onSendMessage, onStop } = useStreamingActions();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (isStreaming) {
      return;
    }
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    onInputChange("");
    onSendMessage(trimmed);
  };

  return (
    <Footer>
      {streamError && <ErrorMessage>{streamError}</ErrorMessage>}
      <Form onSubmit={onSubmit}>
        <InputWrapper>
          <TextArea
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Ask about HVAC products, parts, or equipment..."
            rows={1}
            onKeyDown={handleKeyDown}
          />
          {isStreaming ? (
            <StopButton
              type="button"
              onClick={onStop}
              aria-label="Stop generating response"
            >
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </StopButton>
          ) : (
            <SendButton type="submit" disabled={!inputValue.trim()}>
              Send
            </SendButton>
          )}
        </InputWrapper>
      </Form>
    </Footer>
  );
}

const Footer = styled.footer`
  flex-shrink: 0;
  border-top: 1px solid #e5e5e5;
  background: white;
  padding: 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);

  @media (min-width: 640px) {
    padding: 16px 24px;
  }

  @media (min-width: 1024px) {
    padding: 16px 40px;
  }
`;

const ErrorMessage = styled.div`
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fef3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  font-size: 14px;
  color: #856404;
`;

const Form = styled.form`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputWrapper = styled.div`
  position: relative;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:focus-within {
    border-color: ${Theme.primary};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 56px;
  resize: none;
  border: none;
  background: transparent;
  padding: 16px 80px 16px 16px;
  font-size: 16px;
  color: #333;
  outline: none;

  &::placeholder {
    color: #999;
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.disabled ? "#e5e5e5" : Theme.primary)};
  color: ${(props) => (props.disabled ? "#999" : "white")};

  &:not(:disabled):hover {
    background: #c23520;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const StopButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 8px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: #666;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #444;
  }
`;
