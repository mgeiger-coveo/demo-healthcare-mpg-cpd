/* 
Before you edit:

When editing the 'ProfileConfig', make sure to delete keys 'profile_selected' and 'context_data' in your localStorage to see the changes. 

To access localStorage:

Developer tools > Application > Storage > LocalStorage


* The 'disabled' property make the context uneditable on the frontend
* If 'isDictionaryContext' is true, the key/value is passed into the Search API as 'dictionaryFieldContext', otherwise it is passed as 'context'.

*/

import AnonymousProfile from "../assets/AnonymousProfile.svg";

// DONOT CHANGE
export const KEY_NAME_PROFILE_SELECTED = "profile_selected_v2";
export const KEY_NAME_CONTEXT_DATA = "context_data_v2";

export const ProfileConfig = [
  {
    name: "Anonymous",
    profile: AnonymousProfile,
    context: [],
  },
  {
    name: "Adam Miller",
    email: "amiller@coveo.com",
    language: "en",
    profile: "https://cdn.secta.ai/tmp/marko-headshot.jpeg",
    context: [
      {
        active: true,
        keyName: "country",
        keyValue: "US",
        customQRF: false,
        disabled: false,
        isDictionaryContext: false,
      },
      {
        active: true,
        keyName: "currency",
        keyValue: "USD",
        customQRF: false,
        disabled: false,
        isDictionaryContext: false,
      },
      {
        active: true,
        keyName: "role",
        keyValue: "engineer",
        customQRF: false,
        disabled: true,
        isDictionaryContext: false,
      },
    ],
  },
  {
    name: "Emily Davis",
    email: "edavis@coveo.com",
    language: "fr",
    profile:
      "https://cdn.pixabay.com/photo/2023/03/13/11/19/ai-generated-7849618_960_720.jpg",
    context: [
      {
        active: true,
        keyName: "country",
        keyValue: "US",
        customQRF: false,
        disabled: false,
        isDictionaryContext: false,
      },
      {
        active: true,
        keyName: "currency",
        keyValue: "USD",
        customQRF: false,
        disabled: false,
        isDictionaryContext: false,
      },
      {
        active: true,
        keyName: "role",
        keyValue: "solution",
        customQRF: false,
        disabled: true,
        isDictionaryContext: false,
      },
    ],
  },
];
