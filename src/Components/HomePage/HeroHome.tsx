import React, { useContext } from "react";
import { Theme } from "../../config/theme";
import styled from "styled-components";
import { HeroConfig } from "../../config/HomeConfig";
import { useNavigate } from "react-router-dom";
import { HeroConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";

const HeroHome: React.FC = () => {
  const navigate = useNavigate();
  const { getText } = useContext(LanguageContext);
  return (
    <Wrapper>
      <TextWrapper>
        <Title>
          {HeroConfig.title &&
            getText(HeroConfig.title, HeroConfigTranslations, "title")}
        </Title>
        <SubTitle>
          {HeroConfig.description &&
            getText(
              HeroConfig.description,
              HeroConfigTranslations,
              "description",
            )}
        </SubTitle>
        <Button onClick={() => window.open(HeroConfig.onClickButtonRedirect)}>
          {HeroConfig.buttonText &&
            getText(
              HeroConfig.buttonText,
              HeroConfigTranslations,
              "buttonText",
            )}
        </Button>
      </TextWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  height: ${HeroConfig.height};
  width: ${HeroConfig.width};
  margin: 0 auto;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 120px;
  background-position: center;
  background-color: #333357;
  background-repeat: no-repeat;
  background-size: cover;
  background-image: url(${HeroConfig.background});
  @media (max-width: ${Theme.mobileSize}px) {
    padding-left: 10px;
    width: 100vw;
    justify-content: flex-start;
    padding-top: 80px;
    height: ${Number(HeroConfig.height.split("px")[0]) - 150}px;
  }
`;

const TextWrapper = styled.div`
  width: 100%;
`;

const Title = styled.h1`
  width: 95%;
  font-weight: ${HeroConfig.titleFontWeight};
  max-width: ${HeroConfig.titleWidth};
  font-size: ${HeroConfig.titleFontSize};
  color: ${HeroConfig.titleColor};
  margin-top: 45px;
  @media (max-width: ${Theme.mobileSize}px) {
    font-size: ${Number(HeroConfig.titleFontWeight.substring(0, 2)) - 35}px;
  }
`;

const SubTitle = styled.p`
  font-weight: 300;
  max-width: ${HeroConfig.subTitleWidth};
  font-size: ${HeroConfig.subTitleFontSize};
  width: 90%;
  color: ${HeroConfig.subTitleColor};
  margin-top: 20px;
  @media (max-width: 480px) {
    width: 90%;
  }
`;

const Button = styled.button`
  padding: 2px 32px;
  height: 40px;
  background-color: ${Theme.button};
  border-radius: 8px;
  font-family: inherit;
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  line-height: 24px;
  color: #ffffff;
  margin-top: 10px;
  border: none;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  &:hover {
    background-color: ${Theme.button}CC;
  }
`;

export default HeroHome;
