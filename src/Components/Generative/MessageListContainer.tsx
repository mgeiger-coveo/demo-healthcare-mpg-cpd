import styled from "styled-components";
import type { ReactNode, RefObject } from "react";

type MessageListContainerProps = Readonly<{
  containerRef: RefObject<HTMLDivElement | null>;
  isEmpty: boolean;
  hasContent: boolean;
  emptyState: ReactNode;
  children: ReactNode;
}>;

export function MessageListContainer({
  containerRef,
  isEmpty,
  hasContent,
  emptyState,
  children,
}: MessageListContainerProps) {
  return (
    <Container
      ref={containerRef as RefObject<HTMLDivElement>}
      $hasContent={hasContent}
    >
      {isEmpty ? (
        emptyState
      ) : (
        <ContentWrapper>
          {hasContent && <MessagesWrapper>{children}</MessagesWrapper>}
        </ContentWrapper>
      )}
    </Container>
  );
}

const Container = styled.div<{ $hasContent: boolean }>`
  position: relative;
  flex: 1;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 24px 16px ${(props) => (props.$hasContent ? "128px" : "96px")};

  @media (min-width: 640px) {
    padding-left: 24px;
    padding-right: 24px;
  }

  @media (min-width: 1024px) {
    padding-left: 40px;
    padding-right: 40px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;
