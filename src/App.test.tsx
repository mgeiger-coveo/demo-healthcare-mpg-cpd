// NARROW TEST REPAIR -- called out explicitly for review (Phase 0.1, Workstream B).
//
// This file is a Create-React-App leftover. Its original assertion was
// screen.getByText(/Welcome to Your Coveo React/i), and that copy exists nowhere in src/
// (grep finds only the assertion itself), so the test could never have passed once it
// loaded. It had been masked for a long time because the file failed to LOAD, not to assert.
//
// Three stacked, independent, pre-existing defects kept it from loading. Only the first was
// known when this task started:
//   1. @testing-library/dom was missing, so `screen` did not resolve.
//      -> fixed by adding the devDependency (the one authorized dependency change).
//   2. This jsdom/Node combination provides no Web Storage, and src/common/generateToken.js
//      reads window.localStorage at MODULE scope, so importing App threw during import.
//      -> fixed by a test-only storage stub in src/setupTests.ts. No application file was
//         changed for it.
//   3. The installed @coveo/atomic@3.50.0 imports an internal module WITHOUT a file
//         extension ('.../common/breadbox/breadcrumb-button'). Vite resolves that in the
//         browser; Node's ESM resolver, which vitest uses for externalized packages, cannot,
//         so importing @coveo/atomic-react threw. The file is present on disk -- this is a
//         packaging defect in the dependency, not a missing file.
//      -> worked around below by stubbing @coveo/atomic-react for this test only. Upgrading
//         or patching @coveo/atomic is out of scope for this task.
//
// None of the three is a regression from this task, and none is an application defect. The
// assertion was rewritten to check what App actually renders on first paint rather than
// deleting the test or forcing the stale string to match. The engine initializers are stubbed
// so the smoke test is hermetic and makes no network or Coveo organization call.

import { render, screen } from "@testing-library/react";
import { vi, test, expect } from "vitest";

// Defect 3 workaround: never load the real @coveo/atomic bundle in this environment.
vi.mock("@coveo/atomic-react", () => ({
  AtomicSearchInterface: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="atomic-search-interface">{children}</div>
  ),
}));

// Keep the smoke test hermetic: App kicks off both engine initializers in a mount effect.
// Promises that never settle hold App in its documented loading state with no network call.
vi.mock("./common/Engine", () => ({
  initializeHeadlessEngine: () => new Promise(() => {}),
  initializeCommerceHeadlessEngine: () => new Promise(() => {}),
}));

import App from "./App";

test("renders the loading state until both engines resolve", () => {
  render(<App />);

  // App renders a MUI CircularProgress placeholder while either engine is still null, and
  // shows the "Engine Initialization Failed" panel only once an initializer rejects.
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
  expect(screen.queryByText(/Engine Initialization Failed/i)).toBeNull();
});
