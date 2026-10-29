import { FunctionComponent, useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import styled from "styled-components";
import { Theme } from "../../config/theme";

interface ProviderPhotoProps {
  imageUrl: string | null;
  alt: string;
  initials: string;
  // Rendered box, in pixels. Defaults to the detail-page size; the /mpg cards and the
  // search-box suggestions pass their own so one fallback implementation serves all.
  size?: number;
  radius?: number;
}

const PHOTO_SIZE = 155;
const PHOTO_RADIUS = 16;

// The headshots are hosted on an external domain, so a missing URL and a URL that fails
// to load both fall back to an initials avatar rather than a broken-image icon.
const ProviderPhoto: FunctionComponent<ProviderPhotoProps> = (props) => {
  const {
    imageUrl,
    alt,
    initials,
    size = PHOTO_SIZE,
    radius = PHOTO_RADIUS,
  } = props;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageUrl]);

  const showFallback = !imageUrl || failed;

  if (showFallback) {
    return (
      <InitialsAvatar
        variant="rounded"
        aria-label={alt}
        $size={size}
        $radius={radius}
      >
        {initials}
      </InitialsAvatar>
    );
  }

  return (
    <PhotoFrame $size={size} $radius={radius}>
      {!loaded && (
        <Skeleton
          variant="rounded"
          width={size}
          height={size}
          sx={{ position: "absolute", top: 0, left: 0, bgcolor: "#f0f0f0" }}
        />
      )}
      {/* Explicit width/height attributes reserve the box before the image arrives, so
          neither layout shifts while the external host responds. */}
      <Photo
        src={imageUrl}
        alt={alt}
        width={size}
        height={size}
        $loaded={loaded}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </PhotoFrame>
  );
};

export default ProviderPhoto;

const PhotoFrame = styled.div<{ $size: number; $radius: number }>`
  position: relative;
  flex: 0 0 auto;
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  max-width: 100%;
  border-radius: ${(props) => props.$radius}px;
  overflow: hidden;
  background: #f8f9fa;
`;

const Photo = styled.img<{ $loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${(props) => (props.$loaded ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

const InitialsAvatar = styled(Avatar)<{ $size: number; $radius: number }>`
  flex: 0 0 auto;
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: ${(props) => props.$radius}px;
  /* 0.284 keeps the detail page's original 44px at the default 155px box. */
  font-size: ${(props) => Math.round(props.$size * 0.284)}px;
  font-weight: 600;
  background: ${Theme.primary};
  color: ${Theme.buttonText};
`;
