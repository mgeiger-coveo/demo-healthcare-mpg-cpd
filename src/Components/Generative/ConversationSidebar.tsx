import styled from "styled-components";
import { useState } from "react";
import { Theme } from "../../config/theme";
import { formatRelativeTime } from "../../lib/generative/chat";
import {
  useConversationActions,
  useConversationsState,
} from "../../lib/generative/context";

export function ConversationSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { conversations, activeConversationId } = useConversationsState();
  const { onSelectConversation, onDeleteConversation, onNewConversation } =
    useConversationActions();

  return (
    <Sidebar $isCollapsed={isCollapsed}>
      <SidebarHeader>
        <HeaderContent>
          {isCollapsed ? (
            <ExpandButton
              type="button"
              onClick={() => setIsCollapsed(false)}
              aria-label="Expand sidebar"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </ExpandButton>
          ) : (
            <>
              <SidebarTitle>Conversations</SidebarTitle>
              <CollapseButton
                type="button"
                onClick={() => setIsCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </CollapseButton>
            </>
          )}
        </HeaderContent>
        {isCollapsed ? (
          <NewChatIconButton
            type="button"
            onClick={onNewConversation}
            aria-label="New conversation"
            title="New chat"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </NewChatIconButton>
        ) : (
          <NewChatButton type="button" onClick={onNewConversation}>
            New chat
          </NewChatButton>
        )}
      </SidebarHeader>
      {!isCollapsed && (
        <ConversationNav>
          {conversations.length === 0 ? (
            <EmptyMessage>Start a conversation to see it here.</EmptyMessage>
          ) : (
            <ConversationList>
              {conversations.map((conversation) => {
                const isActive = conversation.localId === activeConversationId;
                return (
                  <ConversationItem key={conversation.localId}>
                    <ConversationRow $isActive={isActive}>
                      <ConversationButton
                        type="button"
                        onClick={() => onSelectConversation(conversation)}
                      >
                        <ConversationTitle>
                          {conversation.title || "Untitled conversation"}
                        </ConversationTitle>
                        <ConversationTime>
                          {formatRelativeTime(conversation.updatedAt)}
                        </ConversationTime>
                      </ConversationButton>
                      <DeleteButton
                        type="button"
                        onClick={() => onDeleteConversation(conversation)}
                        aria-label="Delete conversation"
                      >
                        ✕
                      </DeleteButton>
                    </ConversationRow>
                  </ConversationItem>
                );
              })}
            </ConversationList>
          )}
        </ConversationNav>
      )}
    </Sidebar>
  );
}

// Styled Components

const Sidebar = styled.aside<{ $isCollapsed: boolean }>`
  display: none;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid #e5e5e5;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  transition: all 0.3s;
  width: ${(props) => (props.$isCollapsed ? "64px" : "320px")};

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 12px;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ExpandButton = styled.button`
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: ${Theme.primary};
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: #c23520;
  }
`;

const CollapseButton = styled.button`
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`;

const SidebarTitle = styled.h2`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  margin: 0;
`;

const NewChatIconButton = styled.button`
  padding: 8px;
  border-radius: 50%;
  border: 2px dashed ${Theme.primary};
  cursor: pointer;
  background: transparent;
  color: ${Theme.primary};
  transition: all 0.2s;

  &:hover {
    background: ${Theme.primary};
    color: white;
    border-style: solid;
  }
`;

const NewChatButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: ${Theme.primary};
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: #c23520;
  }
`;

const ConversationNav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 16px 8px 24px;
`;

const EmptyMessage = styled.p`
  padding: 0 16px;
  font-size: 14px;
  color: #666;
`;

const ConversationList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ConversationItem = styled.li``;

const ConversationRow = styled.div<{ $isActive: boolean }>`
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 8px;
  border-radius: 12px;
  transition: all 0.2s;
  background: ${(props) => (props.$isActive ? "#eef2ff" : "white")};
  color: ${(props) => (props.$isActive ? "#4338ca" : "#666")};
  ${(props) => (props.$isActive ? "border: 1px solid #c7d2fe;" : "")}

  &:hover {
    background: ${(props) => (props.$isActive ? "#eef2ff" : "#f5f5f5")};
    color: ${(props) => (props.$isActive ? "#4338ca" : "#333")};
  }
`;

const ConversationButton = styled.button`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
`;

const ConversationTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
`;

const ConversationTime = styled.span`
  font-size: 12px;
  color: #999;
`;

const DeleteButton = styled.button`
  margin-right: 8px;
  margin-top: 8px;
  align-self: flex-start;
  padding: 4px;
  border-radius: 50%;
  font-size: 12px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fef2f2;
    color: #ef4444;
  }
`;
