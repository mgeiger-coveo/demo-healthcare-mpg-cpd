import styled, { keyframes } from "styled-components";
import { useEffect, useState } from "react";

export function Skeleton({
  numLines,
  tick,
}: {
  numLines: number;
  tick: number;
}) {
  const [timeLeft, setTimeLeft] = useState(4);

  useEffect(() => {
    if (timeLeft === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, tick);

    return () => clearInterval(timer);
  }, [timeLeft, tick]);

  return (
    <SkeletonContainer>
      {Array.from({ length: numLines }, (_, i) => i).map((_, i) => (
        <SkeletonLine
          key={i}
          style={{
            width: `${(4 - timeLeft) * 25 - 100 + (100 - i * numLines)}%`,
          }}
        />
      ))}
    </SkeletonContainer>
  );
}

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const SkeletonContainer = styled.div`
  height: 8px;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const SkeletonLine = styled.div`
  margin-top: 8px;
  height: 100%;
  background: linear-gradient(to right, #f9f9f9, #999);
  transition: all 0.5s ease-in-out;
  border-radius: 4px;
  width: 0;
`;
