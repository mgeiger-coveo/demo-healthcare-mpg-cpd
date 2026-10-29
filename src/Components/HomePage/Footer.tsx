import React from "react";
import styled from "styled-components";
import { FooterLogo } from "../../config/HomeConfig";
import { Theme } from "../../config/theme";

const Footer: React.FC = () => {
  return (
    <Wrapper>
      {/*  <Logo src={FooterLogo} />
      <SecurityPrivacy>
        <Title>Security and Privacy</Title>
        <LogosContainer href="https://www.coveo.com/en/platform/security" target="_blank" rel="noreferrer">
          <img src="https://cdn.coveo.com/image/authenticated/s--QzvEYCoG--/d_placeholder-svg.svg/f_svg/v1/web/web01/en/library/icons/certifications/hipaa" width={"100px"} alt="" />
          <img src="https://cdn.coveo.com/image/authenticated/s--5LBA0UjZ--/d_placeholder-svg.svg/f_svg/v1/web/web01/en/library/icons/certifications/soc" alt="" />
          <img src="https://cdn.coveo.com/image/authenticated/s--M9hz0uHO--/d_placeholder-svg.svg/f_svg/v1/web/web01/en/library/icons/certifications/27001" width={"120px"} alt="" />
          <img src="https://cdn.coveo.com/image/authenticated/s--mOZH4Ee2--/d_placeholder-svg.svg/f_svg/v1/web/web01/en/library/icons/certifications/27018" width={"120px"} alt="" />
        </LogosContainer>
      </SecurityPrivacy> */}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  background-color: ${Theme.footer};
  padding: 32px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 960px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const Title = styled.h3`
  font-weight: 300;
  font-size: 18px;
`;

const SecurityPrivacy = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 30px;
  @media (max-width: 960px) {
    margin-top: 20px;
    gap: 10px;
    flex-direction: column;
  }
`;

const LogosContainer = styled.a`
  display: flex;
  gap: 0.5vw;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.img`
  height: 24px;
  object-fit: contain;
  margin-left: 30px;
`;

export default Footer;
