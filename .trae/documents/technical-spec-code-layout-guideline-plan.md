# Technical Specification & Code Layout Guideline Plan

## Summary
- Create a documentation-focused deliverable for the current e-learning workspace that emphasizes API and backend architecture, while also capturing frontend state and lifecycle best practices.
- Ground the specification in the current codebase, which is split between `learning-app` and `server`.
- Document both:
  - the current implementation shape that exists today, and
  - the target backend architecture the user wants next: `route -> controller -> service -> data access -> MongoDB model`.
- Keep implementation scope focused on authoring technical documentation rather than refactoring runtime code.

## Current State Analysis
- The workspace contains two app roots:
  - `c:\Users\Ekema\Documents\sammy work\website\e-learning\learning-app`
  - `c:\Users\Ekema\Documents\sammy work\website\e-learning\server`
- The backend is an Express server started from `server/server.js`.
- Current backend routes are mounted directly in `server/server.js`:
  - `/api/auth`
  - `/api/users`
  - `/api/courses`
- The backend currently stores data in `server/db.json`, not MongoDB.
- Route files currently contain mixed responsibilities:
  - endpoint definitions
  - validation
  - business rules
  - direct file-based data access
- Examples of embedded business logic already present in routes:
  - enrollment rules in `server/routes/courses.js`
  - average rating calculation in `server/routes/courses.js`
  - profile/password logic in `server/routes/users.js`
  - registration/login logic in `server/routes/auth.js`
- The frontend is a React app using React Router and Context:
  - routing shell lives in `learning-app/src/App.js`
  - auth/session state lives in `learning-app/src/context/AuthContext.js`
  - centralized Axios client exists in `learning-app/src/api/axiosInstance.js`
- The frontend already partially implements the requested interceptor pattern:
  - `learning-app/src/api/axiosInstance.js` attaches `elearn_token` to outgoing requests
  - however, `learning-app/src/context/AuthContext.js` still calls raw `axios` directly and also mutates `axios.defaults`
- Current frontend data fetching is mostly component-level with `useEffect`, especially in authenticated pages like `DashboardPage.jsx`, `CoursesPage.jsx`, and `CourseDetailPage.jsx`.

## Proposed Changes

### 1. Add a single source-of-truth technical document
- **File:** `c:\Users\Ekema\Documents\sammy work\website\e-learning\TECHNICAL_SPEC.md`
- **What:** Create one root-level document that captures the architecture guideline and code layout for both backend and frontend.
- **Why:** The user asked for a technical specification and code layout guideline, and a single top-level doc is the clearest handoff artifact for the current repo.
- **How:** Structure the document into these sections:
  - project overview and repo layout
  - current-state architecture summary
  - current API inventory from the existing Express server
  - target backend layered architecture with responsibilities
  - recommended backend folder structure for MongoDB migration
  - frontend state and lifecycle best practices
  - current frontend gaps versus target practice
  - implementation notes and phased adoption guidance

### 2. Document the current backend API surface from real files
- **Files referenced:** `server/server.js`, `server/routes/auth.js`, `server/routes/users.js`, `server/routes/courses.js`, `server/middleware/authMiddleware.js`
- **What:** Capture the actual endpoints, major responsibilities, authentication flow, and data flow currently present in the backend.
- **Why:** The user selected an API-spec focus, so the spec must reflect the routes that truly exist today before defining the target architecture.
- **How:** Summarize:
  - mounted route groups from `server/server.js`
  - auth endpoints for register/login
  - user endpoints for profile retrieval, profile updates, and password changes
  - course endpoints for listing, detail retrieval, CRUD, enrollment, and reviews/status flows present in `server/routes/courses.js`
  - current request path: Express route -> inline logic -> `db.json`

### 3. Define the target backend layered architecture the user requested
- **Files to propose in the document:** `server/routes/*`, `server/controllers/*`, `server/services/*`, `server/repositories/*` or `server/data-access/*`, `server/models/*`, `server/middleware/*`
- **What:** Specify the target separation of concerns:
  - route layer defines endpoints and delegates
  - controller layer handles request/response and validation
  - service layer holds business logic
  - data access layer talks directly to MongoDB models
- **Why:** This is the core architectural requirement from the user and is intentionally different from the current route-heavy implementation.
- **How:** Include:
  - clear responsibilities per layer
  - example request flow for enrollment and rating calculation
  - recommended file naming conventions
  - guidance on keeping controllers thin and business logic in services
  - note that MongoDB is target-state, while current persistence is file-based

### 4. Include a migration-oriented “current vs target” comparison
- **Files referenced:** `server/routes/auth.js`, `server/routes/users.js`, `server/routes/courses.js`, `server/db.json`
- **What:** Add a section comparing the current backend shape to the target MongoDB layered shape.
- **Why:** The user asked for “Both”, so the documentation should explain not only the target design but also how it differs from the existing codebase.
- **How:** Show:
  - current route-heavy pattern
  - target layered pattern
  - which responsibilities would move out of current route files into controllers, services, and data access modules
  - the replacement of `db.json` access with MongoDB model operations

### 5. Capture frontend state, lifecycle, and interceptor guidance
- **Files referenced:** `learning-app/src/App.js`, `learning-app/src/context/AuthContext.js`, `learning-app/src/api/axiosInstance.js`, `learning-app/src/pages/DashboardPage.jsx`, `learning-app/src/pages/CoursesPage.jsx`, `learning-app/src/pages/CourseDetailPage.jsx`
- **What:** Add a frontend section that documents the requested best practices and maps them to the current React codebase.
- **Why:** The user explicitly requested frontend state initialization, cleanup guidance, and JWT attachment strategy.
- **How:** Document:
  - `useEffect` for initial data fetching on component mount
  - cleanup functions for subscriptions, timers, and event listeners
  - centralized API client and request interceptor usage
  - recommendation to standardize on `learning-app/src/api/axiosInstance.js` instead of mixing it with raw `axios`
  - distinction between local component state and global auth/session state in `AuthContext`

## Assumptions & Decisions
- The deliverable after plan approval is documentation, not a backend refactor.
- The document should be written in English because the request content is English-based and technical terminology is clearest in English.
- The specification will prioritize backend/API architecture, with frontend guidance as a supporting section.
- MongoDB and a layered backend are treated as target-state architecture, not current implementation truth.
- The plan will use the actual repo split between `learning-app` and `server` rather than assuming a monorepo abstraction that does not exist on disk.
- The documentation will reference the existing centralized Axios client because it already provides the interceptor baseline requested by the user.

## Verification Steps
- Re-read the authored document to ensure every referenced path exists in the current repo.
- Verify the API inventory against:
  - `server/server.js`
  - `server/routes/auth.js`
  - `server/routes/users.js`
  - `server/routes/courses.js`
- Verify frontend lifecycle/interceptor statements against:
  - `learning-app/src/context/AuthContext.js`
  - `learning-app/src/api/axiosInstance.js`
  - relevant page components using `useEffect`
- Confirm the document clearly distinguishes:
  - current backend = Express + `db.json`
  - target backend = Express + route/controller/service/data-access + MongoDB
- Confirm the document contains a concrete proposed folder layout and responsibility table for the target backend architecture.
