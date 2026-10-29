// ./middlewares.js

"use strict";

import {
  KEY_NAME_CONTEXT_DATA,
  KEY_NAME_PROFILE_SELECTED,
  ProfileConfig,
} from "../config/ProfileConfig";

const MY_USERS = [import.meta.env.VITE_USER_EMAIL];

const SavedContextData = JSON.parse(
  window.localStorage.getItem(KEY_NAME_CONTEXT_DATA),
);
const SavedProfileSelected = JSON.parse(
  window.localStorage.getItem(KEY_NAME_PROFILE_SELECTED),
);

const ContextData =
  SavedContextData !== null ? SavedContextData : ProfileConfig;
const profileSelected =
  SavedProfileSelected !== null ? SavedProfileSelected : ProfileConfig[0].name;

const filterdProfile = ContextData.filter(
  (item) => item.name === profileSelected,
);

const filterdContext = filterdProfile[0].context;

const filterDictionaryFieldContext = filterdContext.filter(
  (x) => x.isDictionaryContext === true,
);

let dictionaryFieldContextObject = {};

filterDictionaryFieldContext.forEach((item) => {
  dictionaryFieldContextObject[item.keyName] = item.keyValue;
});

export const getSearchTokenCommerce = async (req, res, next) => {
  // If VITE_SEARCH_API_KEY is defined, use it directly instead of generating a token
  const searchApiKey = import.meta.env.VITE_SEARCH_API_KEY;
  if (searchApiKey) {
    return searchApiKey;
  }

  const postData = {
    userIds: MY_USERS.map((user) => ({
      name: filterdProfile[0]?.email ? filterdProfile[0].email : user,
      provider: "Email Security Provider",
    })),
    dictionaryFieldContext: dictionaryFieldContextObject,
  };

  try {
    // Use Netlify function instead of direct API call
    const response = await fetch("/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: filterdProfile[0]?.email || MY_USERS[0],
        dictionaryFieldContext: dictionaryFieldContextObject,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const body = await response.json();
    return body.token;
  } catch (error) {
    console.error("Failed to fetch token from Netlify function:", error);
    throw error;
  }
};
