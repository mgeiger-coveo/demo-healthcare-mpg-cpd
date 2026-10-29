import styled from "styled-components";
import type { Result } from "@coveo/headless";
import MenuBook from "@mui/icons-material/MenuBook";
import { Link } from "react-router-dom";
import { Theme } from "../../config/theme";

interface ResultCardProps {
  result: Result;
}

export function ResultCard({ result }: ResultCardProps) {
  const timeToRead = Math.ceil((result.raw.wordcount as number) / 200);
  const tags = (result.raw["articletags"] || []) as string[];

  return (
    <CardContainer key={result.uniqueId}>
      <CardContent>
        <CardInner>
          <TitleLink to={result.clickUri}>{result.title}</TitleLink>

          <ReadingTime>
            Reading time {timeToRead} minute{timeToRead > 1 ? "s" : ""}
          </ReadingTime>

          <ShortDesc>{result.raw["ec_shortdesc"] as string}</ShortDesc>
          <Excerpt>{result.excerpt}</Excerpt>

          <TagsContainer>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </TagsContainer>

          <UrlLink to={result.clickUri}>
            {decodeURIComponent(result.clickUri)}
          </UrlLink>
        </CardInner>
      </CardContent>
      <SourceContainer>
        <SourceLabel>
          <MenuBook sx={{ fontSize: 12, marginRight: "16px" }} />
          {result.raw.source}
        </SourceLabel>
      </SourceContainer>
    </CardContainer>
  );
}

// Styled Components

const CardContainer = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 0;
  list-style: none;
`;

const CardContent = styled.div`
  display: flex;
  min-width: 0;
  gap: 16px;
`;

const CardInner = styled.div`
  min-width: 0;
  flex: 1;
`;

const TitleLink = styled(Link)`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ReadingTime = styled.p`
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: ${Theme.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ShortDesc = styled.p`
  margin-top: 4px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const Excerpt = styled.p`
  margin-top: 4px;
  font-size: 16px;
  color: #666;
`;

const TagsContainer = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const Tag = styled.span`
  margin-top: 2px;
  white-space: nowrap;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 500;
  color: #166534;
  background: #f0fdf4;
  border: 1px solid rgba(22, 163, 74, 0.2);
  border-radius: 6px;
`;

const UrlLink = styled(Link)`
  margin-top: 8px;
  display: block;
  font-size: 12px;
  color: #666;
  text-decoration: underline;
`;

const SourceContainer = styled.div`
  display: none;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;

  @media (min-width: 640px) {
    display: flex;
  }
`;

const SourceLabel = styled.p`
  margin-top: 4px;
  font-size: 14px;
  color: ${Theme.primary};
  display: flex;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
