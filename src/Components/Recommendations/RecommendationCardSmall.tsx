import React from "react";
import { Theme } from "../../config/theme";
import styled from "styled-components";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface RecommendationCardSmallType {
  title: string;
  description: string;
  image: string;
  video?: boolean;
  clickUri: string;
  onClick: () => void;
  onContextMenu: () => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

const RecommendtionCardSmall: React.FC<RecommendationCardSmallType> = ({
  title,
  description,
  video = false,
  clickUri,
  onClick,
  onContextMenu,
  onMouseDown,
  onMouseUp,
  image,
}) => {
  return (
    <MainWrapper
      key={title}
      onClick={() => {
        onClick();
        window.open(clickUri, "_blank", "noopener,noreferrer");
      }}
      onContextMenu={onContextMenu}
      /*  onMouseDown={onMouseDown}
      onMouseUp={onMouseUp} */
    >
      {video ? (
        <VideoWrapper>
          <Image src={image} />
          <Title>{title}</Title>
        </VideoWrapper>
      ) : (
        <TextWrapper>
          <Title>{title}</Title>
          <SubTitle>{description}</SubTitle>
        </TextWrapper>
      )}
    </MainWrapper>
  );
};

export const SkeletonRecommendtionCardSmall: React.FC = () => {
  return (
    <MainWrapper>
      <div style={{ padding: "30px 20px" }}>
        <Skeleton count={1} style={{ marginBottom: "20px", height: "40px" }} />
        <Skeleton count={2} style={{ margin: "10px 0px" }} />
      </div>
    </MainWrapper>
  );
};

const TextWrapper = styled.div`
  display: flex;
  /* width: 100%; */
  height: 140px;
  justify-content: space-around;
  padding: 10px 10px;
  flex-direction: column;
`;

const Image = styled.img`
  width: 90%;
  height: 80%;
  margin-top: 10px;
  object-fit: center;
  margin-bottom: 10px;
`;

const VideoWrapper = styled.div`
  display: flex;
  height: 250px;
  align-items: center;
  justify-content: space-around;
  padding: 10px 10px;
  flex-direction: column;
`;

const Title = styled.a`
  font-family: inherit;
  text-decoration: none;
  font-style: normal;
  align-self: flex-start;
  font-weight: 400;
  font-size: 18px;
  line-height: 32px;
  margin: 0px 20px;
  /*   width: 95%; */

  color: ${Theme.primaryText};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const SubTitle = styled.span`
  font-family: inherit;
  font-style: normal;
  font-weight: 300;
  font-size: 14px;
  margin: 0px 20px;
  width: 90%;
  line-height: 26px;
  color: ${Theme.primaryText};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ReferralLink = styled.a`
  font-family: inherit;
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  color: ${Theme.primary};
  text-decoration: none;
  display: flex;
  align-self: flex-start;
  opacity: 0.8;
  cursor: pointer;
`;

const MainWrapper = styled.div`
  /* width: 100%; */
  border-radius: 16px;
  border: 1px solid #e5e8e8;
  overflow: hidden;
  margin: 10px 10px 10px 10px;
  background: white;
  height: auto;
  cursor: pointer;
  &:hover {
    border-color: ${Theme.primary};
  }

  &:hover ${Title} {
    color: ${Theme.primary};
  }

  &:hover ${ReferralLink} {
    opacity: 1;
  }
`;

export default RecommendtionCardSmall;
