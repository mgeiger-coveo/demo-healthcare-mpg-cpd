# AGENTS.md - Development Guide

This document provides essential information for AI coding agents working on the demo-healthcare-mpg-cpd Healthcare Commerce project.

## Project Overview

A React + TypeScript application showcasing Coveo's Commerce API with a Node.js/Express token server backend. Uses Vite for frontend bundling, Material-UI for components, and includes both Commerce and Content search features.

## Build, Lint & Test Commands

### Frontend (Root)

```bash
# Development server (runs api-server.js + vite on port 5173)
npm run dev
npm start                    # Alternative dev command

# Production build
npm run build

# Preview production build
npm run preview

# Start API server only (runs on port 3001)
npm run api-server

# Run single test file
npm test -- src/App.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Common Test Patterns

- Frontend tests: `src/**/*.test.tsx` using @testing-library/react
- Test files are co-located with source files

## Code Style Guidelines

### TypeScript Configuration

**Frontend (tsconfig.json):**

- Target: ES5
- Strict mode: **DISABLED** (`"strict": false`)
- JSX: react-jsx (React 17+ transform)
- Module: esnext with node resolution

### Import Conventions

**Frontend imports order:**

1. React core imports
2. Third-party libraries (MUI, Coveo, etc.)
3. Local components and utilities
4. Config files
5. Types
6. Styles

**Frontend imports:**

```typescript
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Grid, Typography } from "@mui/material";
import { SearchEngine } from "@coveo/headless";
import HomePage from "./Components/HomePage/HomePage";
import { Theme } from "./config/theme";
import styled from "styled-components";
```

**API server imports (api-server.js):**

```javascript
const express = require("express");
const cors = require("cors");
require("dotenv").config();
```

### Naming Conventions

**Files:**

- Components: PascalCase (e.g., `CategoryFacet.tsx`, `HomePage.tsx`)
- Utilities: camelCase (e.g., `usePersistedState.ts`)
- Config: PascalCase (e.g., `SearchConfig.tsx`, `HomeConfig.tsx`)
- Types: PascalCase with "Types" suffix (e.g., `ConfigTypes.tsx`)

**Variables & Functions:**

- camelCase for variables and functions
- PascalCase for React components and interfaces
- SCREAMING_SNAKE_CASE for constants exported from config

**Interfaces:**

```typescript
interface FacetProps {
  title: string | undefined;
  field: string;
}

interface HTTPError extends Error {
  statusCode: number;
}
```

### Formatting

- **No ESLint/Prettier config** - follow existing code patterns
- Indentation: 2 spaces
- Double quotes for strings (imports, JSX attributes)
- Template literals for string interpolation
- Semicolons required (backend), optional (frontend)
- Trailing commas in objects/arrays

### Component Patterns

**Function Components (preferred):**

```typescript
const ComponentName: FunctionComponent<Props> = (props) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // side effects
  }, [dependencies]);

  return (
    <Wrapper>
      {/* JSX */}
    </Wrapper>
  );
};

export default ComponentName;
```

**Hooks usage:**

- Use `React.useState` or `useState` (both patterns exist in codebase)
- Extract custom hooks to `customHooks/` directory
- Name custom hooks with `use` prefix (e.g., `usePersistedState`)

**Styled Components:**

```typescript
const Wrapper = styled.div`
  border: 1px #e5e8e8 solid;
  border-radius: 16px;
  padding: 24px 16px;
`;
```

### Type Safety

- Frontend has `strict: false` - be permissive with types
- Use `any` sparingly but acceptable when needed (e.g., `config: Record<string, any>`)
- Prefer interfaces over types for object shapes
- Use type imports: `import type { Type } from 'module'`

### Error Handling

**Frontend:**

```typescript
// Simple console.error for development
console.error("Unable to set custom translations...");

// User-facing errors via UI
return <Error />;
```

### Environment Variables

- Frontend: Prefix with `VITE_` (e.g., `VITE_PLATFORM_URL`)
- Access via `import.meta.env.VITE_*`
- Backend: No prefix, use `dotenv` package
- Never commit `.env` file (contains API keys)
- Required variables checked in `App.tsx:isEnvValid()`

## Branch Naming

Follow format: `feature/<work-item-description>`

Example: `feature/search-improvements`

## Key Dependencies

- **React 18.3.28**
- **TypeScript 5.9.3**
- **Vite 7.3.1** (build tool)
- **@coveo/headless 3.44.0** (search engine)
- **@coveo/atomic-react 3.11.0** (UI components)
- **Material-UI 7.3.8** (design system)
- **styled-components 6.3.10** (CSS-in-JS)

## Common Patterns

- Context providers for global state (Engine, Language, CustomContext)
- Headless controllers with subscribe pattern for state management
- Co-located test files with source code
- Configuration-driven features (enable/disable via config files)
