import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Fade from "@mui/material/Fade";
import Popover from "@mui/material/Popover";
import React, { useContext, useEffect, useState } from "react";
import { Icon } from "react-icons-kit";
import { search } from "react-icons-kit/feather/search";
import { x } from "react-icons-kit/feather/x";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { HeaderConfig, HeaderLogo } from "../../config/HomeConfig";
import {
  HomeHeaderConfigTranslations,
  InternationalizationEnabled,
} from "../../config/InternationalizationConfig";
import { Theme } from "../../config/theme";
import ContextForm from "../CustomContext/ContextForm";
import { CustomContextContext } from "../CustomContext/CustomContextContext";
import { InternationalizationDropdown } from "../Internationalization/InternationalizationDropdown";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import HomeProductsSearchBox from "./HomeProductsSearchBox";
import BasicMenu from "./Menu";

const Header: React.FC = () => {
  /*   const plpListResponse = await fetch(
    new URL(
      `${organizationEndpoints.admin}/rest/organizations/${import.meta.env.VITE_ORGANIZATION_ID}/commerce/v2/configurations/listings?page=0&perPage=100`,
    ),
    { method: 'GET', headers: { Authorization: `Bearer ${import.meta.env.PRODUCT_LISTING_API_KEY}` } },
  );

  const json = await plpListResponse.json();

  const urlValidator = /\/browse\/promotions\//;
  const validItems = json.items.filter((item) => urlValidator.test(item.matching.url));

  const listings = validItems.map((item) => {
    const splitUrl = item.matching.url.split('/');
    const name = splitUrl[splitUrl.length - 1].replace(/-/g, ' ').trim();

    return { name: name.charAt(0).toUpperCase() + name.slice(1), urls: [item.matching.url] };
  }); */

  const [openSearch, setOpenSearch] = useState<boolean>(false);
  const navigate = useNavigate();
  const { getProfile } = useContext(CustomContextContext);
  const { getText } = useContext(LanguageContext);
  const onSearchPage =
    window.location.pathname.includes("search") ||
    window.location.pathname.includes("browse") ||
    window.location.pathname.includes("product") ||
    window.location.pathname.includes("plp");
  const toggleSearchBox = () => {
    if (onSearchPage) {
      const input = document.querySelector(".search-box input");
      if (input instanceof HTMLElement) {
        input.focus();
      }
      return;
    }
    setOpenSearch(!openSearch);
  };

  useEffect(() => {
    if (openSearch) {
      const input = document.querySelector(".home-search-box input");
      if (input instanceof HTMLElement) {
        input.focus();
      }
    }
  }, [openSearch]);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <>
      <Wrapper>
        <Logo src={HeaderLogo} onClick={() => navigate("/home")} />
        <RightWrapper>
          <LinkWrapper>
            {HeaderConfig.map((item, index) => {
              if (index === 0) return <BasicMenu key="products-menu" />;

              return (
                <NavigationLink key={item.title} href={item.redirectTo}>
                  {item.title &&
                    getText(
                      item.title,
                      HomeHeaderConfigTranslations,
                      item.title,
                    )}
                </NavigationLink>
              );
            })}
            <IconsWrapper>
              <IconContainer
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/chat")}
              >
                <StyledSparklesIcon className="animate-pulse" />
              </IconContainer>
              <IconContainer
                style={{ cursor: "pointer" }}
                onClick={() => toggleSearchBox()}
              >
                {openSearch && !onSearchPage ? (
                  <div style={{ color: Theme.searchIcon }}>
                    <Icon icon={x} size={24} />
                  </div>
                ) : (
                  <div style={{ color: Theme.searchIcon }}>
                    <Icon icon={search} size={24} />
                  </div>
                )}
              </IconContainer>
              <ProfileIconContainer
                style={{ color: "black", cursor: "pointer" }}
                aria-describedby={id}
                onClick={(event) => handleClick(event)}
              >
                <ProfileAvatar src={getProfile().profile} alt={"profile pic"} />
                <ProfileName>
                  {getProfile().name.split(" ").slice(0, -1).join(" ")}
                </ProfileName>
              </ProfileIconContainer>
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <ContextForm />
              </Popover>
              {InternationalizationEnabled && <InternationalizationDropdown />}
            </IconsWrapper>
          </LinkWrapper>
        </RightWrapper>
      </Wrapper>
      <Fade in={openSearch && !onSearchPage}>
        <SearchContainer>
          <SearchBoxContainer>
            {!onSearchPage && (
              <HomeProductsSearchBox toggleSearchBox={toggleSearchBox} />
            )}
          </SearchBoxContainer>
        </SearchContainer>
      </Fade>
    </>
  );
};

const Wrapper = styled.header`
  box-shadow: 0 2px 8px rgb(229 232 232 / 75%);
  position: fixed;
  top: 0;
  z-index: 99;
  padding: 12px 0;
  width: 100%;
  max-height: 64px;
  color: ${Theme.primaryText};
  background-color: #ffffff;
  display: flex;
  align-items: center;
  transition: max-height 0.3s ease-out;
`;

const Logo = styled.img`
  height: 50px;
  width: 150px;
  object-fit: contain;
  padding-left: 10px;
`;

const RightWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  flex: 1;
  margin-right: 50px;
`;

const LinkWrapper = styled.ul`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 800px;
  @media (max-width: 1000px) {
    width: auto;
  }
`;

const NavigationLink = styled.a`
  color: ${Theme.primaryText};
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  opacity: 1;
  transition: 0.2s ease-in-out all;
  &:hover {
    opacity: 0.7;
  }
  @media (max-width: 1000px) {
    display: none;
  }
`;

const Divider = styled.div`
  height: 50px;
  border-right-width: 2px;
  width: 1px;
  height: 48px;
  background: #e5e8e8;
  @media (max-width: 1000px) {
    display: none;
  }
`;

const SearchContainer = styled.div`
  width: 100%;
  height: 150px;
  margin-top: 10px;
  box-shadow: 0px 6px 16px rgba(229, 232, 232, 0.75);
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  background-color: white;
  justify-content: center;
  position: fixed;
  z-index: 9;
`;

const IconsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const IconContainer = styled.button`
  background: none;
  border: 0px;
  width: 40px;
  transition: 0.2s ease-in-out all;
  &:hover {
    transform: scale(0.95);
  }
  &:active {
    transform: scale(0.85);
  }
`;

const ProfileName = styled.span`
  font-size: 16px;
  font-weight: 400;
  font-family: inherit;
  margin-left: 15px;
  color: ${Theme.secondaryText};
  text-overflow: ellipsis;
`;

const ProfileIconContainer = styled.button`
  background: none;
  border: 0px;
  margin-left: 20px;
  width: 90px;
  display: flex;
  align-items: center;
  transition: 0.2s ease-in-out all;
  &:hover {
    transform: scale(0.95);
  }
  &:active {
    transform: scale(0.85);
  }
`;

const SearchBoxContainer = styled.div`
  width: 50%;
  margin-top: 50px;
  max-width: 800px;
  min-width: 500px;
  @media (max-width: 480px) {
    min-width: 80vw;
  }
`;

const ProfileAvatar = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 24px;
  object-fit: cover;
`;

const StyledSparklesIcon = styled(AutoAwesome)`
  color: ${Theme.primary};
  vertical-align: bottom;
`;

export default Header;
