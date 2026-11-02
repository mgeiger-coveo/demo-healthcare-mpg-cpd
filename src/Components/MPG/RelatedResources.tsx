import { FunctionComponent, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import { Theme } from "../../config/theme";

interface RelatedResource {
  title: string;
  description: string;
  type?: string;
  link: string;
}

interface RelatedResourcesProps {
  query: string;
  isLoading: boolean;
  error: string | null;
  resources: RelatedResource[];
}

const INITIAL_RESULT_LIMIT = 5;

const RelatedResources: FunctionComponent<RelatedResourcesProps> = (props) => {
  const { query, isLoading, error, resources } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setIsExpanded(resources.length > 0);
    setShowAll(false);
  }, [query, resources.length]);

  if (!query) return null;

  const visibleResources = showAll
    ? resources
    : resources.slice(0, INITIAL_RESULT_LIMIT);

  return (
    <Section aria-labelledby="related-resources-heading">
      <HeadingButton
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <div>
          <Typography
            variant="h6"
            component="h2"
            id="related-resources-heading"
          >
            Related Services &amp; Resources
          </Typography>
          <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
            Information related to “{query}”
          </Typography>
        </div>
        <span>{isExpanded ? "Hide" : "Show"}</span>
      </HeadingButton>

      {!resources.length && (
        <ResourcesRegion aria-live="polite">
          {isLoading ? (
            <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
              Loading related services and resources...
            </Typography>
          ) : error ? (
            <Typography variant="body2" color="error">
              Related services and resources are unavailable right now. An
              approved resource source and mpg-healthcare-resources pipeline are
              still needed.
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
              No related services or resources are available for this search. An
              approved resource source and mpg-healthcare-resources pipeline are
              still needed.
            </Typography>
          )}
        </ResourcesRegion>
      )}

      {resources.length > 0 && (
        <Collapse in={isExpanded}>
          <ResourcesRegion>
            <ResourceList>
              {visibleResources.map((resource) => (
                <ResourceCard key={resource.link}>
                  {resource.type && (
                    <ResourceType>{resource.type}</ResourceType>
                  )}
                  <Typography variant="subtitle1" component="h3">
                    <ResourceLink href={resource.link}>
                      {resource.title}
                    </ResourceLink>
                  </Typography>
                  {resource.description && (
                    <Typography
                      variant="body2"
                      sx={{ color: Theme.secondaryText, marginTop: "6px" }}
                    >
                      {resource.description}
                    </Typography>
                  )}
                </ResourceCard>
              ))}
            </ResourceList>
            {resources.length > INITIAL_RESULT_LIMIT && (
              <Button
                size="small"
                sx={{ marginTop: "12px" }}
                onClick={() => setShowAll((visible) => !visible)}
              >
                {showAll ? "Show less" : "Show more"}
              </Button>
            )}
          </ResourcesRegion>
        </Collapse>
      )}
    </Section>
  );
};

export default RelatedResources;

const Section = styled.section`
  border-top: 1px #e5e8e8 solid;
  margin-top: 32px;
  padding-top: 24px;
`;

const HeadingButton = styled.button`
  align-items: center;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  justify-content: space-between;
  padding: 0;
  text-align: left;
  width: 100%;
`;

const ResourcesRegion = styled.div`
  margin-top: 16px;
`;

const ResourceList = styled.div`
  display: grid;
  gap: 12px;
`;

const ResourceCard = styled.article`
  border: 1px #e5e8e8 solid;
  border-radius: 12px;
  padding: 16px;
`;

const ResourceType = styled.div`
  color: ${Theme.secondaryText};
  font-size: 0.75rem;
  margin-bottom: 4px;
  text-transform: uppercase;
`;

const ResourceLink = styled.a`
  color: ${Theme.primary};
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;
