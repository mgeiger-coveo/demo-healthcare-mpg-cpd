import styled, { keyframes, css } from "styled-components";
import { memo } from "react";
import type { ConversationThinkingUpdate } from "../../types/conversation";

type ThinkingStatusPanelProps = {
  updates: ConversationThinkingUpdate[];
  isStreaming: boolean;
  isExpanded: boolean;
  onToggle: () => void;
};

function ThinkingStatusPanelComponent({
  updates,
  isStreaming,
  isExpanded,
  onToggle,
}: Readonly<ThinkingStatusPanelProps>) {
  if (!updates.length) {
    return null;
  }

  const latestUpdate = updates.at(-1);
  const latestText = latestUpdate?.message ?? "";
  const updateCount = updates.length;
  const isDone = !isStreaming;
  const panelId = `thinking-updates-${updates[0]?.message ?? "panel"}`;

  return (
    <Panel>
      <ToggleButton
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <LeftContent>
          {isDone ? (
            <DoneIcon aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.25 7.5L6.75 9L9.5 5.75"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="7"
                  cy="7"
                  r="5.875"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
              </svg>
            </DoneIcon>
          ) : (
            <PulsingDot aria-hidden="true">
              <PulsingRing />
              <DotCenter />
            </PulsingDot>
          )}
          <TextContent>
            <ThinkingLabel>Thinking</ThinkingLabel>
            <ThinkingStatus>
              {latestText || "Gathering the best response..."}
            </ThinkingStatus>
          </TextContent>
        </LeftContent>
        <RightContent>
          <StepCount>
            {updateCount} step{updateCount === 1 ? "" : "s"}
          </StepCount>
          <ExpandIcon $isExpanded={isExpanded}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3.25 4.5L6 7.25L8.75 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ExpandIcon>
        </RightContent>
      </ToggleButton>
      {isExpanded && (
        <UpdatesList id={panelId}>
          {updates.map((update, index) => (
            <UpdateItem
              key={index}
              $kind={update.type === "tool_call" ? "tool" : undefined}
            >
              <Bullet
                $kind={update.type === "tool_call" ? "tool" : undefined}
              />
              <span>{update.message}</span>
            </UpdateItem>
          ))}
        </UpdatesList>
      )}
    </Panel>
  );
}

export const ThinkingStatusPanel = memo(ThinkingStatusPanelComponent);

// Styled Components

const ping = keyframes`
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const Panel = styled.div`
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const ToggleButton = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

const LeftContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DoneIcon = styled.span`
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #d1fae5;
  background: #ecfdf5;
  color: #059669;
`;

const PulsingDot = styled.span`
  position: relative;
  display: inline-flex;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

const PulsingRing = styled.span`
  position: absolute;
  display: inline-flex;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e0e7ff;
  animation: ${ping} 1s cubic-bezier(0, 0, 0.2, 1) infinite;
`;

const DotCenter = styled.span`
  position: relative;
  display: inline-flex;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6366f1;
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ThinkingLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const ThinkingStatus = styled.span`
  font-size: 12px;
  color: #666;
  word-wrap: break-word;
`;

const RightContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
`;

const StepCount = styled.span``;

const ExpandIcon = styled.span<{ $isExpanded: boolean }>`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  color: #666;
  transition: all 0.2s;
  background: ${(props) => (props.$isExpanded ? "#f5f5f5" : "white")};

  svg {
    transition: transform 0.2s;
    transform: ${(props) =>
      props.$isExpanded ? "rotate(180deg)" : "rotate(0deg)"};
  }
`;

const UpdatesList = styled.div`
  margin-top: 16px;
`;

const UpdateItem = styled.li<{ $kind?: string }>`
  display: flex;
  max-width: 100%;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
  list-style: none;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Bullet = styled.span<{ $kind?: string }>`
  margin-top: 6px;
  display: inline-flex;
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${(props) => (props.$kind === "tool" ? "#38bdf8" : "#818cf8")};
`;
