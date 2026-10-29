import { SearchEngine } from "@coveo/headless";
import { CommerceEngine } from "@coveo/headless/commerce";
import { createContext } from "react";
const EngineContext = createContext<SearchEngine | null>(null);

export const EngineProvider = EngineContext.Provider;

export default EngineContext;

export const CommerceEngineContext = createContext<CommerceEngine | null>(null);

export const CommerceEngineProvider = CommerceEngineContext.Provider;
