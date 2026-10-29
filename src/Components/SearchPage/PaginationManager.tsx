import { buildProductListing, buildSearch } from "@coveo/headless/commerce";
import { Pagination, Button } from "@mui/material";
import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { Theme } from "../../config/theme";
import { SearchConfigTranslations } from "../../config/InternationalizationConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";

const PaginationManagerRenderer = ({ paginationManagerController }) => {
  const [state, setState] = useState(paginationManagerController.state);
  const [pageSize, setPageSize] = useState(0);
  const { getText } = useContext(LanguageContext);

  useEffect(() => {
    const unsubscribe = paginationManagerController.subscribe(() => {
      setState(paginationManagerController.state);
      setPageSize(paginationManagerController.state.pageSize);
    });
    return () => unsubscribe();
  }, [paginationManagerController]);

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    paginationManagerController.selectPage(value - 1);
  };

  return (
    <Wrapper>
      {state.totalEntries > 0 && (
        <PaginationWrapper>
          <div>
            <Pagination
              page={state.page + 1}
              count={state.totalPages}
              shape="rounded"
              color="primary"
              onChange={handleChange}
            />
          </div>
          <ResultsPerPage>
            <p>
              {getText(
                "Results per page",
                SearchConfigTranslations,
                "resultsPerPage",
              )}
            </p>
            {[12, 24, 48, 96].map((size) => (
              <button
                key={size}
                style={{
                  background: pageSize === size ? `${Theme.primary}` : "",
                  color: pageSize === size ? "white" : "",
                }}
                onClick={() => paginationManagerController.setPageSize(size)}
              >
                {size}
              </button>
            ))}
          </ResultsPerPage>
        </PaginationWrapper>
      )}
    </Wrapper>
  );
};

const PaginationManager = ({ engine, productListing = false }) => {
  let controller = null;
  if (productListing) {
    controller = buildProductListing(engine);
  } else {
    controller = buildSearch(engine);
  }

  if (controller.state.error) {
    return null;
  }

  const paginationManagerController = controller.pagination();

  return (
    <PaginationManagerRenderer
      paginationManagerController={paginationManagerController}
    />
  );
};

export default PaginationManager;

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0px;
  gap: 40px;
`;

const PaginationWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ResultsPerPage = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  p {
    margin-right: 10px;
  }

  button {
    border: none;
    background: none;
    font-size: 16px;
    color: #282829;
    cursor: pointer;
    border-radius: 5px;
    padding: 5px 10px;
  }

  button:hover {
    background: #f5f5f5;
  }
`;
