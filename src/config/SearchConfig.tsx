/* 
FieldToIncludesInSearchResults helps you add more fields to the result templates. 
When setting imageField in this file, make sure the field is included in the FieldToIncludesInSearchResults array. 

The fields 'date', 'ytthumbnailurl', 'sysfiletype' should NOT be removed. 
*/

import {
  DefaultSideBarRecommendationConfigType,
  SearchPageTabConfigType,
} from "./Types/ConfigTypes";

export const FieldToIncludesInSearchResults: string[] = [
  // "sfanswer__c",
  // "sfid",
  "sysfiletype",
  "date",
  "adimage",
  "ytthumbnailurl",
  "sfimage__c",
  "sfimage_url__c",
  "adspecial",
  "ytthumbnailurl",
  "ytvideoduration",
  "pdp",
  "dictField",
  "hc_provider_status",
  "hc_provider_status",
  "hc_specialties",
  "hc_languages",
  "hc_accepting_patients",
  "hc_telehealth",
  "hc_locations",
  "hc_services",
  "hc_profile_url",
  "hc_medical_group",
  "hc_board_certification",
];

export const NoResultRecommendationConfig = {
  active: true,
  slotID: "0dae3845-6a1a-48e9-95d6-72e8e9bc0c9f",
};

export const SearchBarTitle = "What can we help you find?";

export const SpeechToText = false;

//---------------------------- FOR CONTENT SEARCH ----------------------------

export const EnableContentSearch = false;

export const SearchPageTabConfig: SearchPageTabConfigType[] = [
  {
    caption: "Products",
    expression: "",
    isActive: true,
    commerceTab: true,
  },
  {
    caption: "Content",
    expression: "",
    isActive: false,
    commerceTab: false,
  },
];

export const DefaultSideBarRecommendationConfig: DefaultSideBarRecommendationConfigType[] =
  []; /* [{
  pipeline: "IRS test",
  NumberofResults: 5,
  title: "Related for Investing",
  videoRecommendation: true,
  imageField: 'ytthumbnailurl'
}] */

export const ResultsImageField = "ec_images"; // mainly required for eCommerce use cases

export const NoResultRecommendationContentConfig = {
  heading: "Popular Results",
  pipeline: "cmh-search-healthcare_cpd_demo-24a948a3",
  searchHub: "default",
  NumberofResults: 6,
  imageField: "ec_images",
  excerptField: "ec_description",
  showQuerySuggestion: true,
};

export const ImageToText = false;

export const EnableSmartSnippetToggle = true;

export const EnableGenQAToggle = true;

export const EnableDebugMode = false;

export const EnableRecentQueries = true;

export const EnableRecentResultList = true;
