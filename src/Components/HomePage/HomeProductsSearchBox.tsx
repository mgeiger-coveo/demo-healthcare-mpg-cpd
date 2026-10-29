import { FunctionComponent, useEffect, useState, useContext } from "react";
import TextField from "@mui/material/TextField";
import {
  SearchBox as HeadlessSearchBox,
  StandaloneSearchBoxOptions,
  buildSearchBox,
  loadSearchActions,
  /*   loadSearchAnalyticsActions, */
  loadQueryActions,
  buildRedirectionTrigger,
  buildNotifyTrigger,
  Search as CommerceSearch,
  buildInstantProducts,
  RedirectionTrigger,
} from "@coveo/headless/commerce";
import EngineContext, {
  CommerceEngineContext,
} from "../../common/engineContext";
import { redirect, useNavigate } from "react-router-dom";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import styled from "styled-components";
import { ClickAwayListener, IconButton } from "@mui/material";
import { Theme } from "../../config/theme";
import Button from "@mui/material/Button";
import { Icon } from "react-icons-kit";
import { search } from "react-icons-kit/feather/search";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { HomeProductsSearchBoxTranslations } from "../../config/InternationalizationConfig";
import { HeaderLogo } from "../../config/HomeConfig";
import { SpeechRecognitionButton } from "../SearchPage/SpeechRecognitionButton";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { STANDALONE_SEARCHBOX_KEY } from "./HomeSearchBox";

//const defaultSearchPageRedirect = ()=> window.open(`/search`, '_self')

interface HomeProductsSearchBoxProps {
  searchBoxController: HeadlessSearchBox;
  toggleSearchBox: () => void;
  resultsController: any;
  redirectController: RedirectionTrigger;
}

const HomeProductsSearchBoxRenderer: FunctionComponent<
  HomeProductsSearchBoxProps
> = (props) => {
  const { searchBoxController, resultsController, redirectController } = props;
  const engine = useContext(CommerceEngineContext)!;
  const [state, setState] = useState(searchBoxController.state);
  const [redirect, setRedirect] = useState(redirectController.state);
  const [searchTerm, setSearchTerm] = useState("");
  const [openPopper, setOpenPopper] = useState(false);
  const { getText } = useContext(LanguageContext);
  const [resultsState, setResultsState] = useState(resultsController.state);

  const defaultSearchPageRedirect = async () => {
    const headers = new Headers();
    headers.append("accept", "application/json");
    headers.append(
      "Authorization",
      `Bearer ${engine.configuration.accessToken}`,
    );
    headers.append("Content-Type", "application/json");
    const raw = JSON.stringify({
      q: searchTerm,
      context: {
        "commerce-api": "Search",
        trackingId: engine.configuration.analytics.trackingId,
      },
    });

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: raw,
    };

    let res = await fetch(
      `https://${engine.configuration.organizationId}.org.coveo.com/rest/search/v2/plan?organizationId=${engine.configuration.organizationId}`,
      requestOptions,
    );
    let resJson = (await res.json()) as any;
    if (
      resJson &&
      resJson.preprocessingOutput &&
      resJson.preprocessingOutput.triggers &&
      resJson.preprocessingOutput.triggers.length > 0
    ) {
      const redirTrigger = resJson.preprocessingOutput.triggers.find(
        (trigger: any) => trigger.type === "redirect",
      );
      if (redirTrigger && redirTrigger.content) {
        window.open(redirTrigger.content, "_self");
        return;
      }
    }
    window.open("/search", "_self");
  };

  useEffect(
    () =>
      searchBoxController.subscribe(() => setState(searchBoxController.state)),
    [searchBoxController],
  );

  useEffect(() => {
    (redirectController.subscribe(() => {
      setRedirect(redirectController.state);
    }),
      [redirectController]);
  });

  useEffect(
    () =>
      resultsController.subscribe(() =>
        setResultsState(resultsController.state),
      ),
    [resultsController],
  );

  useEffect(() => {
    const unsub = setTimeout(async () => {
      resultsController.updateQuery(searchTerm);

      localStorage.setItem(
        STANDALONE_SEARCHBOX_KEY,
        JSON.stringify({ value: searchTerm }),
      );
    }, 0);

    return () => clearTimeout(unsub);
  }, [searchTerm]);

  const onPressSearchButton = () => {
    props.toggleSearchBox();
    searchBoxController.submit();

    if (searchTerm === "") {
      defaultSearchPageRedirect();
      return;
    }

    defaultSearchPageRedirect();
  };

  return (
    <Container>
      <MainWrapper>
        <ClickAwayListener onClickAway={() => setOpenPopper(false)}>
          <>
            <TextField
              autoComplete="off"
              value={searchTerm}
              onChange={(event) => {
                const newInputValue = event.target.value;
                searchBoxController.updateText(newInputValue);
                resultsController.updateQuery(newInputValue);
                setSearchTerm(newInputValue);
              }}
              onFocus={() => {
                setOpenPopper(true);
              }}
              onBlur={() => {
                setOpenPopper(false);
              }}
              InputProps={{
                endAdornment: (
                  <EndButtons>
                    {state.value.length > 0 && (
                      <ClearButton
                        onClick={() => searchBoxController.updateText("")}
                      >
                        <CloseIcon />
                      </ClearButton>
                    )}
                    <SpeechRecognitionButton
                      controller={searchBoxController}
                      callback={defaultSearchPageRedirect}
                    ></SpeechRecognitionButton>
                  </EndButtons>
                ),
              }}
              className="home-search-box"
              placeholder={getText(
                "Search",
                HomeProductsSearchBoxTranslations,
                "searchPlaceholder",
              )}
              size="small"
              onKeyDown={(e) => {
                if (
                  e.code === "Enter" &&
                  searchBoxController.state.value !== ""
                ) {
                  props.toggleSearchBox();
                  searchBoxController.submit();
                  /* navigate("/search"); */
                  defaultSearchPageRedirect();
                }
              }}
            />
            <PopperStyledComponent
              hidden={!openPopper}
              style={{
                width: "120%",
              }}
            >
              <PopperMainWrapper>
                <PopperQSContainer>
                  <PopperTitle>
                    {getText(
                      "Suggested Searches",
                      HomeProductsSearchBoxTranslations,
                      "suggestedSearches",
                    )}{" "}
                  </PopperTitle>
                  {state.suggestions.length > 0 ? (
                    <>
                      {state.suggestions.map((suggestion) => {
                        const matches = match(suggestion.rawValue, searchTerm);
                        const parts = parse(suggestion.rawValue, matches);
                        return (
                          <PopperQSListItem
                            key={suggestion.rawValue}
                            onMouseDown={(event) => {
                              event.stopPropagation();
                              searchBoxController.updateText(
                                suggestion.rawValue,
                              );
                              setSearchTerm(suggestion.rawValue);
                              props.toggleSearchBox();
                              searchBoxController.submit();
                              defaultSearchPageRedirect();
                              /* navigate("/search"); */
                            }}
                          >
                            <SearchIconStyled />
                            <div>
                              {parts.map((part, index) => (
                                <span
                                  key={index}
                                  style={{
                                    fontWeight: part.highlight ? 500 : 300,
                                  }}
                                >
                                  {part.text}
                                </span>
                              ))}
                            </div>
                          </PopperQSListItem>
                        );
                      })}
                    </>
                  ) : null}
                </PopperQSContainer>
                {resultsState.products.length > 0 && (
                  <PopperResultsContainer>
                    <PopperTitle>
                      {getText(
                        "Featured Results",
                        HomeProductsSearchBoxTranslations,
                        "featuredResults",
                      )}
                    </PopperTitle>

                    <ResultContainer>
                      {resultsState.products.length > 0 ? (
                        <>
                          {resultsState.products.slice(0, 6).map((result) => {
                            let src: any = result.ec_images[0];
                            return (
                              <PopperResultItem
                                key={result.permanentid}
                                onMouseDown={() => {
                                  window.open(result.clickUri, "_blank");
                                }}
                              >
                                <PopperResultImage
                                  src={src ? src : HeaderLogo}
                                  style={
                                    src
                                      ? {}
                                      : {
                                          background: "#e9e9e9",
                                          objectFit: "contain",
                                          padding: "20px",
                                        }
                                  }
                                  alt={result.ec_name}
                                />
                                <PopperResultTitle
                                  href={result.clickUri}
                                  onMouseDown={() => {
                                    window.open(result.clickUri, "_blank");
                                  }}
                                >
                                  {result.ec_name}
                                </PopperResultTitle>
                                <PopperResultDescription>
                                  {result.ec_description}
                                </PopperResultDescription>
                              </PopperResultItem>
                            );
                          })}
                        </>
                      ) : (
                        <></>
                      )}
                    </ResultContainer>
                    <CenteredDiv>
                      <PopperSeeMore
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          props.toggleSearchBox();
                          searchBoxController.updateText(searchTerm);
                          searchBoxController.submit();
                          defaultSearchPageRedirect();
                          window.open(
                            "/search" + window.location.hash,
                            "_self",
                          );
                        }}
                      >
                        {getText(
                          "More Results",
                          HomeProductsSearchBoxTranslations,
                          "moreResults",
                        )}
                      </PopperSeeMore>
                    </CenteredDiv>
                  </PopperResultsContainer>
                )}
              </PopperMainWrapper>
            </PopperStyledComponent>
          </>
        </ClickAwayListener>
      </MainWrapper>
      <SearchButton
        type="submit"
        variant="contained"
        style={{ height: "43px", marginLeft: "10px" }}
        onClick={onPressSearchButton}
      >
        <Icon icon={search} size={24} />
      </SearchButton>
    </Container>
  );
};

interface SearchBoxType {
  toggleSearchBox: () => void;
}

const HomeProductsSearchBox = ({ toggleSearchBox }: SearchBoxType) => {
  const options: StandaloneSearchBoxOptions = {
    numberOfSuggestions: 8,
    redirectionUrl: "/search",
  };

  const engine = useContext(CommerceEngineContext)!;
  const [searchBoxController, setSearchBoxController] =
    useState<HeadlessSearchBox | null>(null);
  const [resultsController, setResultsController] = useState<any | null>(null);
  const [redirectController, setRedirectController] = useState<any | null>(
    null,
  );

  useEffect(() => {
    if (engine) {
      setSearchBoxController(buildSearchBox(engine, { options }));
      setResultsController(
        buildInstantProducts(engine, {
          options: {
            cacheTimeout: 100,
          },
        }),
      );
      setRedirectController(buildRedirectionTrigger(engine));
    }
  }, [engine]);

  // Clear this search box's query text on every commit of this component, AFTER React has
  // rendered.
  //
  // Why the reset is needed at all: the commerce querySet reducer handles
  // executeSearch.fulfilled with updateAllQuerySetQuery, which writes the executed query
  // into EVERY registered querySet entry. This box is built with no `id`, so it owns a
  // randomID('search_box') entry that gets the query of any search run anywhere in the app
  // (for example from /mpg), while its visible input stays empty -- the input is the
  // renderer's local `searchTerm`. Three things read the controller entry rather than the
  // input: the clear (x) button's visibility, the Enter guard, and submit()/performSearch().
  // Without this reset the header would show a clear button on an empty-looking box and its
  // search button would execute a stale query.
  //
  // Why it lives in an effect and not in the render body: dispatching during render notified
  // the subscribed HomeProductsSearchBoxRenderer mid-render, which is what produced React's
  // "Cannot update a component while rendering a different component" warning.
  //
  // Why there is NO dependency array: the reset must keep the cadence it had in the render
  // body, which was "every render of this component", not "every navigation". Header
  // (src/Components/HomePage/Header.tsx) re-renders this component without any navigation
  // whenever its own `openSearch` or `anchorEl` state changes -- and the `openSearch` flip
  // from the header search icon is the render immediately before the box becomes visible,
  // because MUI Fade keeps it mounted but hidden. That is precisely the render at which the
  // stale entry has to be gone. Keying the effect to the router location dropped it there:
  // on /mpg a submitted query reaches this box's entry via updateAllQuerySetQuery while the
  // route never changes (MPGPage writes the hash with history.replaceState), so opening the
  // header box would have shown a clear (x) button over an empty input and let Enter submit
  // a query the user never typed in it. Running on every commit is the faithful, clean
  // equivalent of the old cadence: same number of updateText("") dispatches, and therefore
  // the same empty-query querySuggest count, with none of them in the render phase.
  //
  // No cleanup is returned because updateText has nothing to undo, and running after commit
  // means it can neither dispatch during another component's render nor fire after unmount.
  useEffect(() => {
    if (!searchBoxController) {
      return;
    }
    searchBoxController.updateText("");
  });

  // NOTE: a `resultsController.updateQuery("")` call used to sit in the render body next to
  // the reset above. It was REMOVED rather than relocated: buildInstantProducts().updateQuery
  // returns early on a falsy query, so passing "" dispatched nothing, changed no state,
  // issued no productSuggest request and notified no subscriber -- it was dead code. The
  // renderer's own [searchTerm] effect already owns this controller's query and still passes
  // "" on mount, so nothing that existed before is lost.

  if (searchBoxController && resultsController) {
    return (
      <HomeProductsSearchBoxRenderer
        searchBoxController={searchBoxController}
        toggleSearchBox={toggleSearchBox}
        resultsController={resultsController}
        redirectController={redirectController}
      />
    );
  } else {
    return null;
  }
};

export default HomeProductsSearchBox;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 45px;
  z-index: 8;
  position: relative;
  width: 100%;
`;

const PopperStyledComponent = styled.div`
  background: white;
  border-radius: 6px;
  box-shadow: 0px 7px 13px 2px rgba(0, 0, 0, 0.08);
  position: relative;
`;

const PopperMainWrapper = styled.div`
  width: 100%;
  display: flex;
  padding: 20px;
  gap: 50px;
`;

const PopperImage = styled.img``;

const PopperQSContainer = styled.div`
  flex: 1.5;
  margin: 0px 0px;
`;
const PopperResultsContainer = styled.div`
  flex: 3;
  padding-bottom: 20px;
  justify-content: flex-start;
`;

const ResultContainer = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 5px;
  padding: 0;
  margin-top: 10px;
`;

const PopperQSListItem = styled.li`
  list-style: none;
  padding: 5px 5px;
  cursor: pointer;
  transition: all 0.1s ease-in;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  width: 100%;
  &:hover {
    background-color: #f2f2f2;
  }
  &.active {
    background-color: #f2f2f2;
  }
`;

const PopperResultTitle = styled.a`
  color: ${Theme.primaryText};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  overflow: hidden;
  margin-top: 10px;
  display: -webkit-box;
  width: 150px;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  cursor: pointer;
  &:hover {
    text-decoration: none;
  }
`;

const PopperResultDescription = styled.p`
  color: ${Theme.secondaryText};
  font-size: 10px;
  overflow: hidden;
  display: -webkit-box;
  margin-top: 5px;
  width: 150px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;
const PopperTitle = styled.h3`
  color: ${Theme.primaryText};
  font-size: 16px;
  margin-bottom: 5px;
  margin-top: 10px;
  margin-left: 0px;
`;

const PopperAdContainer = styled.div`
  flex: 2;
  background: url("https://docs.citrix.com/assets/images/image-5.png") no-repeat;
  background: white;
`;

const PopperAdImage = styled.img`
  width: 100%;
`;

const PopperResultItem = styled.li`
  width: 100%;
  list-style: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  padding: 10px;
  border-radius: 5px;
  &:hover {
    background-color: #f2f2f2;
  }
  &.active {
    background-color: #f2f2f2;
  }

  &:hover ${PopperResultTitle} {
    text-decoration: none;
  }
`;

const PopperResultImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  object-position: center;
  background-color: #f2f2f2;
`;

const PopperSeeMore = styled.span`
  font-size: 13px;
  font-family: inherit;
  font-weight: 300;
  color: dimgray;
  opacity: 0.8;
  margin-top: 30px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: 1px solid #e9e9e9;
  padding: 5px 15px;
  border-radius: 5px;
  &:hover {
    opacity: 1;
    color: dimgray;
    background-color: #f2f2f2;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const SearchButton = styled(Button)`
  height: 43px;
  margin-left: 10px;
  background-color: white;
  color: #0071ce;
`;

const EndButtons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  padding: 0 4px;
`;

const ClearButton = styled(IconButton)`
  transform: scale(0.75);
  padding: 0;
`;

const SearchIconStyled = styled(SearchIcon)`
  width: 12px;
  margin-right: 5px;
  margin-top: 4px;
`;

const CenteredDiv = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
