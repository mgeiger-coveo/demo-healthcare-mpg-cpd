import styled from "styled-components";

export function AnswerSection({
  children,
  className = "",
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Section className={className}>{children}</Section>;
}

const Section = styled.section`
  min-height: 96px;
`;
