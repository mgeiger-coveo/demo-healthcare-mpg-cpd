import React from "react";
import styled from "styled-components";
import { Theme } from "../../config/theme";

interface ErrorBannerProps {
  message?: string;
  details?: string;
  onRetry?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  details,
  onRetry,
}) => {
  return (
    <ErrorWrapper>
      <ErrorIcon>!</ErrorIcon>
      <ErrorContent>
        <ErrorMessage>{message || "Something went wrong."}</ErrorMessage>
        {details && <ErrorDetails>{details}</ErrorDetails>}
      </ErrorContent>
      {onRetry && <RetryButton onClick={onRetry}>Try again</RetryButton>}
    </ErrorWrapper>
  );
};

export default ErrorBanner;

const ErrorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  background-color: #fff3f4;
  margin: 16px 0;
  width: 100%;
  box-sizing: border-box;
`;

const ErrorIcon = styled.div`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #dc3545;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
`;

const ErrorContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ErrorMessage = styled.p`
  margin: 0;
  font-weight: 500;
  color: ${Theme.primaryText};
  font-size: 14px;
`;

const ErrorDetails = styled.p`
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #666;
  word-break: break-word;
`;

const RetryButton = styled.button`
  flex-shrink: 0;
  padding: 8px 16px;
  border: 1px solid ${Theme.primary};
  border-radius: 6px;
  background: white;
  color: ${Theme.primary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;

  &:hover {
    background-color: ${Theme.primary};
    color: white;
  }
`;
