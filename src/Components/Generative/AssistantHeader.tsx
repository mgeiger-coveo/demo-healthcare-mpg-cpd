import styled from "styled-components";

interface AssistantHeaderProps {
  isEmpty: boolean;
}

export function AssistantHeader({ isEmpty }: AssistantHeaderProps) {
  if (!isEmpty) {
    return null;
  }

  return (
    <Header>
      <div>
        <Title>Commerce Assistant</Title>
        <Subtitle>
          Find products and accessories tailored to your needs.
        </Subtitle>
      </div>
    </Header>
  );
}

const Header = styled.header`
  flex-shrink: 0;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  padding: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @media (min-width: 640px) {
    padding: 16px 24px;
  }

  @media (min-width: 1024px) {
    padding: 16px 40px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;
