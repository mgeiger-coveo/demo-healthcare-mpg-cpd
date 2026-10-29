import { Divider, Skeleton } from "@mui/material";
import styled from "styled-components";

const FacetSkeleton = () => {
  return (
    <Wrapper>
      <Skeleton variant="text" width={"100%"} height={50} />
      <Skeleton variant="text" width={200} height={50} />
      <Skeleton variant="text" width={200} height={50} />
      <Skeleton variant="text" width={200} height={50} />
      <Skeleton variant="text" width={200} height={50} />
    </Wrapper>
  );
};

export default FacetSkeleton;

const Wrapper = styled.div`
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  padding: 24px 30px;
  margin-bottom: 20px;
  font-family: inherit;
`;
