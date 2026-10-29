import styled from "styled-components";
import { memo } from "react";
import { Theme } from "../../config/theme";
import {
  useStreamingActions,
  useStreamingState,
} from "../../lib/generative/context";

type EmptyStateProps = {
  prompts: string[];
};

function EmptyStateComponent({ prompts }: EmptyStateProps) {
  const { isStreaming } = useStreamingState();
  const { onSendMessage } = useStreamingActions();
  return (
    <Container>
      <Title>How can I help you today?</Title>
      <Description>
        Ask me to find products, compare equipment, or help with your HVAC
        needs.
      </Description>
      <PromptsContainer>
        {prompts.map((prompt) => (
          <PromptButton
            key={prompt}
            type="button"
            disabled={isStreaming}
            onClick={() => onSendMessage(prompt)}
          >
            {prompt}
          </PromptButton>
        ))}
      </PromptsContainer>
    </Container>
  );
}

export const EmptyState = memo(EmptyStateComponent);

const Container = styled.div`
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px;
  text-align: center;
  background: white;
  border: 2px dashed #e5e5e5;
  border-radius: 24px;
  color: #666;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const Description = styled.p`
  max-width: 500px;
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const PromptsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
`;

const PromptButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  font-size: 14px;
  color: ${(props) => (props.disabled ? "#999" : "#666")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:not(:disabled):hover {
    border-color: ${Theme.primary};
    color: ${Theme.primary};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;
