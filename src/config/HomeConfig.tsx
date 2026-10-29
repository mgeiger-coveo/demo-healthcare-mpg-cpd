import HeroImage from "../assets/Hero.svg";
import CoveoLogo from "../assets/CoveoLogo.svg";
import RecommendationDefault from "../assets/Recommendation.jpg";
import {
  CommerceRecommendationType,
  RecommendationType,
} from "./Types/ConfigTypes";

/* To import your Demo Logo
1. Place the logo in the assets Folder
2. import the logo into this file using the following statement

    import DemoLogo from "../assests/<Logo-Image-filename>"  

    * it is important to add the coorect image extension type in the end of the filename e.g. DemoImage.png, DemoImage.svg or DemoImage.jpg

3. Replace the CoveoLogo with DemoLogo below.
*/

export const HeaderLogo = CoveoLogo;

export const FooterLogo = CoveoLogo;

export const DefaultRecommendationImage = RecommendationDefault;

// TODO When generating JSON, dynamically generate internationalization config in admin console to include these elements.
export const HeaderConfig = [
  {
    title: "Service Support",
    redirectTo: "/home",
  },
  {
    title: "Ecommerce",
    redirectTo: "/",
  },
  {
    title: "Workplace",
    redirectTo: "/",
  },
  {
    title: "Site Search",
    redirectTo: "/",
  },
  {
    title: "AI Labs",
    redirectTo: "/",
  },
  {
    title: "Docs",
    redirectTo: "/docs",
  },
];

export const HeroConfig = {
  title:
    "The only AI platform specifically built to make every digital experience delightful, relevant, and profitable",
  description:
    "Advanced search. Relevant recommendations. Unrivaled personalization",
  background: HeroImage,
  buttonText: "Explore",
  onClickButtonRedirect: "/search",
  width: "100%",
  height: "700px",

  // Hero Image Text CSS config
  titleFontSize: "32px",
  titleFontWeight: "600",
  titleColor: "#FFFFFF",
  titleWidth: "600px",
  subTitleWidth: "550px",
  subTitleFontSize: "16px",
  subTitleColor: "#FFFFFF",
};

export const HomeRecommendationConfig: CommerceRecommendationType[] = [
  {
    active: true, // changing to "false" will hide this recommendation
    type: "list", // "list" | "carousel" | "slider"
    slotID: import.meta.env.VITE_COMMERCE_RECS_SLOTID,
  },
  {
    active: true, // changing to "false" will hide this recommendation
    type: "carousel", // "list" | "carousel" | "slider"
    slotID: "0dae3845-6a1a-48e9-95d6-72e8e9bc0c9f",
  },
  {
    active: true, // changing to "false" will hide this recommendation
    type: "slider", // "list" | "carousel" | "slider"
    slotID: "0dae3845-6a1a-48e9-95d6-72e8e9bc0c9f",
  },
];

export const EnableAuthentication = false;
