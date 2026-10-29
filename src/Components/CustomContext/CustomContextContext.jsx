import React, { useContext, useEffect, useState } from "react";
import usePersistedState from "../../customHooks/usePersistedState";
import {
  ProfileConfig,
  KEY_NAME_CONTEXT_DATA,
  KEY_NAME_PROFILE_SELECTED,
} from "../../config/ProfileConfig";
import EngineContext from "../../common/engineContext";
import { buildContext, buildDictionaryFieldContext } from "@coveo/headless";
import { buildContext as buildContextCommerce } from "@coveo/headless/commerce";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import {
  InternationalizationEnabled,
  DefaultLanguage,
} from "../../config/InternationalizationConfig";

export const settingContextFromEngineFirstTime = (engine) => {
  const controller = buildContext(engine);
  const SavedContextData = JSON.parse(
    window.localStorage.getItem(KEY_NAME_CONTEXT_DATA),
  );
  const SavedProfileSelected = JSON.parse(
    window.localStorage.getItem(KEY_NAME_PROFILE_SELECTED),
  );
  const ContextData =
    SavedContextData !== null ? SavedContextData : ProfileConfig;
  const profileSelected =
    SavedProfileSelected !== null
      ? SavedProfileSelected
      : ProfileConfig[0].name;
  const dictionaryContext = buildDictionaryFieldContext(engine);

  const filterdProfile = ContextData.filter(
    (item) => item.name === profileSelected,
  );

  const filterdContext = filterdProfile[0].context;
  const { ContextSetObject, DictionaryContextSetObject } =
    configureContext(filterdContext);

  controller.set(ContextSetObject);
  if (InternationalizationEnabled)
    controller.add(
      "language",
      filterdProfile[0]?.language
        ? filterdProfile[0]?.language
        : DefaultLanguage,
    );
  dictionaryContext.set(DictionaryContextSetObject);
};

export const settingCommerceContextFromEngineFirstTime = (engine) => {
  const controller = buildContextCommerce(engine);
  const SavedContextData = JSON.parse(
    window.localStorage.getItem(KEY_NAME_CONTEXT_DATA),
  );
  const SavedProfileSelected = JSON.parse(
    window.localStorage.getItem(KEY_NAME_PROFILE_SELECTED),
  );
  const Locale = JSON.parse(window.localStorage.getItem("locale"));
  const ContextData =
    SavedContextData !== null ? SavedContextData : ProfileConfig;
  const profileSelected =
    SavedProfileSelected !== null
      ? SavedProfileSelected
      : ProfileConfig[0].name;

  const filterdProfile = ContextData.filter(
    (item) => item.name === profileSelected,
  );

  const filterdContext = filterdProfile[0].context;
  const { ContextSetObject } = configureContext(filterdContext);

  if (
    ContextSetObject.hasOwnProperty("country") &&
    ContextSetObject.country !== undefined
  )
    controller.setCountry(ContextSetObject.country);

  if (
    ContextSetObject.hasOwnProperty("currency") &&
    ContextSetObject.currency !== undefined
  )
    controller.setCurrency(ContextSetObject.currency);

  if (InternationalizationEnabled);
  controller.setLanguage(Locale ? Locale : DefaultLanguage);
};

export const CustomContextContext = React.createContext();

const CustomContextProvider = ({ children }) => {
  const [profileSelected, setProfiledSelected] = usePersistedState(
    KEY_NAME_PROFILE_SELECTED,
    ProfileConfig[0].name,
  );
  const [ContextData, setContextData] = usePersistedState(
    KEY_NAME_CONTEXT_DATA,
    ProfileConfig,
  );

  const engine = useContext(EngineContext);
  const controller = buildContext(engine);
  const dictionaryContext = buildDictionaryFieldContext(engine);
  const { selectedLanguage, changeLanguage } = useContext(LanguageContext);

  const settingContext = () => {
    const filterdProfile = ContextData.filter(
      (item) => item.name === profileSelected,
    );

    const filterdContext = filterdProfile[0].context;
    const { ContextSetObject, DictionaryContextSetObject } =
      configureContext(filterdContext);

    if (
      InternationalizationEnabled &&
      filterdProfile[0]?.language != selectedLanguage
    )
      changeLanguage(
        filterdProfile[0]?.language
          ? filterdProfile[0]?.language
          : DefaultLanguage,
      );

    controller.set(ContextSetObject);
    if (InternationalizationEnabled)
      controller.add("language", selectedLanguage);
    dictionaryContext.set(DictionaryContextSetObject);
  };

  const settingContextFromEngine = (engine) => {
    const controller = buildContext(engine);
    const filterdProfile = ContextData.filter(
      (item) => item.name === profileSelected,
    );

    const filterdContext = filterdProfile[0].context;
    const { ContextSetObject, DictionaryContextSetObject } =
      configureContext(filterdContext);

    controller.set(ContextSetObject);
    if (InternationalizationEnabled)
      controller.add("language", selectedLanguage);
    dictionaryContext.set(DictionaryContextSetObject);
  };

  // To update the persisted context (Can be used for prioritizing content based off language)
  useEffect(() => {
    if (!InternationalizationEnabled) return;
    const updatedContextData = ContextData.map((user) => {
      if (user.name == profileSelected && user.language != selectedLanguage)
        user.language = selectedLanguage;
      return user;
    });
    setContextData(updatedContextData);
  }, [selectedLanguage]);

  useEffect(() => {
    settingContext();
  }, [profileSelected]);

  const getProfile = () => {
    const filterdProfile = ContextData.filter(
      (item) => item.name === profileSelected,
    )[0];

    return filterdProfile;
  };

  const handleSave = () => {
    settingContext();
    window.location.reload();
  };

  return (
    <CustomContextContext.Provider
      value={{
        profileSelected,
        setProfiledSelected,
        ContextData,
        setContextData,
        settingContext,
        handleSave,
        getProfile,
        settingContextFromEngine,
      }}
    >
      {children}
    </CustomContextContext.Provider>
  );
};

export const configureContext = (filteredContext) => {
  let ContextSetObject = {},
    DictionaryContextSetObject = {};
  filteredContext.forEach((item) => {
    let isContext =
      item.active && item.keyName && item.keyValue && !item.isDictionaryContext;
    let isDictContext =
      item.active && item.keyName && item.keyValue && item.isDictionaryContext;
    if (isContext) {
      ContextSetObject[item.keyName] = item.keyValue.includes(",")
        ? item.keyValue.split(",")
        : item.keyValue;
    } else if (isDictContext) {
      DictionaryContextSetObject[item.keyName] = item.keyValue.includes(",")
        ? item.keyValue.split(",")
        : item.keyValue;
    }
  });
  // setPersistentLanguage(ContextSetObject);
  return { ContextSetObject, DictionaryContextSetObject };
};

export default CustomContextProvider;
