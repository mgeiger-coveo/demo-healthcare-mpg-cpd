import styled from "styled-components";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { Theme } from "../../config/theme";
import type {
  NextAction,
  RefinementChip,
} from "../../lib/generative/message-markup-parser";

type RefinementChipsBarProps = Readonly<{
  chips: RefinementChip[];
  messageId: string;
}>;

export function RefinementChipsBar({
  chips,
  messageId,
}: RefinementChipsBarProps) {
  return (
    <ChipsContainer>
      {chips.map((chip, index) => (
        <RefinementChipTag key={`${messageId}-chip-${index}`}>
          <ChipIcon>
            <FilterListOutlined sx={{ fontSize: 14, color: "#888" }} />
          </ChipIcon>
          {chip.label}
        </RefinementChipTag>
      ))}
    </ChipsContainer>
  );
}

type NextActionsBarProps = Readonly<{
  actions: NextAction[];
  messageId: string;
  onFollowUpClick?: (message: string) => void;
}>;

export function NextActionsBar({
  actions,
  messageId,
  onFollowUpClick,
}: NextActionsBarProps) {
  const searchActions = actions.filter((a) => a.type === "search" && a.query);
  const followupActions = actions.filter(
    (a) => a.type === "followup" && a.message,
  );

  return (
    <ActionsContainer>
      {searchActions.map((action, index) => (
        <SearchActionLink
          key={`${messageId}-search-${index}`}
          href={`/search?q=${encodeURIComponent(action.query || "")}`}
        >
          <ActionIcon>
            <SearchOutlined sx={{ fontSize: 14 }} />
          </ActionIcon>
          {action.query}
        </SearchActionLink>
      ))}
      {followupActions.map((action, index) => (
        <FollowUpButton
          key={`${messageId}-followup-${index}`}
          type="button"
          onClick={() => onFollowUpClick?.(action.message || "")}
        >
          <ActionIcon>
            <ChatBubbleOutlineOutlined sx={{ fontSize: 14 }} />
          </ActionIcon>
          {action.message}
        </FollowUpButton>
      ))}
    </ActionsContainer>
  );
}

// Styled Components

const ChipsContainer = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const RefinementChipTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
`;

const ChipIcon = styled.span`
  display: flex;
  align-items: center;
`;

const ActionsContainer = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ActionIcon = styled.span`
  display: flex;
  align-items: center;
`;

const SearchActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${Theme.primary};
  color: ${Theme.buttonText};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: #c23520;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(214, 59, 38, 0.3);
  }
`;

const FollowUpButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  color: #333;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${Theme.primary};
    color: ${Theme.primary};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(214, 59, 38, 0.3);
  }
`;
