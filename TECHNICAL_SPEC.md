# Technical Specification and Code Layout Guideline

## 1. Purpose

This document defines the technical specification and code layout guideline for the e-learning platform in this repository. It has two goals:

1. describe the current implementation as it exists today, and
2. define the target backend architecture and frontend best practices the project should follow next.

This specification prioritizes backend API architecture and data flow, with frontend state and lifecycle guidance included as supporting implementation standards.

## 2. Repository Layout

The repository is currently split into two application roots:

```text
e-learning/
  learning-app/   # React frontend
  server/         # Express backend
```

### Current frontend layout

```text
learning-app/
  src/
    api/
      axiosInstance.js
    components/
      ProtectedRoute.jsx
    context/
      AuthContext.js
    pages/
      HomePage.jsx
      LoginPage.jsx
      RegisterPage.jsx
      CoursesPage.jsx
      CourseDetailPage.jsx
      DashboardPage.jsx
    App.js
    index.css
```

### Current backend layout

```text
server/
  middleware/
    authMiddleware.js
  routes/
    auth.js
    users.js
    courses.js
  db.json
  server.js
```

## 3. Current State Architecture

### 3.1 Backend summary

- Runtime: Node.js + Express
- Entry point: `server/server.js`
- Authentication: JWT bearer token
- Persistence: file-based JSON storage in `server/db.json`
- API mounting:
  - `/api/auth`
  - `/api/users`
  - `/api/courses`

### Current backend request flow

The current backend follows this simplified flow:

```text
HTTP Request
  -> Express route in server/routes/*.js
  -> inline validation and response handling
  -> inline business logic
  -> direct read/write to db.json
  -> JSON response
```

### Current backend characteristics

- Route files currently define endpoints and also perform validation.
- Route files also contain business rules, for example:
  - enrollment eligibility
  - one-review-per-user checks
  - course rating calculation
  - password change rules
- Route files directly interact with storage through helper functions such as `readDB()` and `writeDB()`.
- The current implementation is functional for small-scale development, but it mixes HTTP concerns, business logic, and persistence logic in the same files.

### 3.2 Frontend summary

- Runtime: React + React Router
- Global auth/session state: `learning-app/src/context/AuthContext.js`
- Centralized API client: `learning-app/src/api/axiosInstance.js`
- Protected routing: `learning-app/src/components/ProtectedRoute.jsx`
- Main page data loading happens in page-level components with `useEffect`

### Current frontend request flow

```text
Page component
  -> useEffect or user action
  -> axiosInstance or raw axios call
  -> backend API
  -> local component state update or AuthContext update
  -> UI render
```

### Current frontend characteristics

- The project already has a centralized Axios instance with a request interceptor that attaches `elearn_token`.
- `AuthContext.js` still uses raw `axios` directly for `/api/users/me` and also mutates `axios.defaults`.
- Most page data is handled with local component state rather than a broader server-state library.
- `useEffect` is already used for data initialization in pages such as `CoursesPage.jsx` and `CourseDetailPage.jsx`.
- Cleanup patterns for timers, subscriptions, and event listeners are not yet standardized across the frontend.

## 4. Current API Inventory

This section documents the backend surface that currently exists in the repository.

### 4.1 Auth API

Base path: `/api/auth`

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/register` | Create a user account and return JWT + user payload | Public |
| POST | `/login` | Authenticate user and return JWT + user payload | Public |

### 4.2 User API

Base path: `/api/users`

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/me` | Get current authenticated user profile | Required |
| PUT | `/me` | Update current user profile fields | Required |
| PUT | `/me/password` | Change current user password | Required |

### 4.3 Course API

Base path: `/api/courses`

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/` | List courses with search/category/price filters | Public |
| GET | `/:id` | Get single course details | Public |
| POST | `/` | Create a course | Required |
| PUT | `/:id` | Update owned course | Required |
| DELETE | `/:id` | Delete owned course | Required |
| POST | `/:id/enroll` | Enroll in a course | Required |
| GET | `/:id/enrollment-status` | Check if current user is enrolled | Required |
| GET | `/:id/reviews` | List reviews for a course | Public |
| POST | `/:id/reviews` | Submit a review for an enrolled course | Required |
| GET | `/enrolled/me` | List current user enrolled courses | Required |

## 5. Current Authentication and Data Flow

### Authentication flow

1. A user registers or logs in through `/api/auth/register` or `/api/auth/login`.
2. The backend returns a JWT token and a user payload.
3. The frontend stores the token in `localStorage` under `elearn_token`.
4. `axiosInstance.js` attaches the token to outgoing requests through a request interceptor.
5. Protected backend endpoints validate the bearer token with `authMiddleware.js`.

### Current persistence flow

1. A route handler receives a request.
2. The route reads `server/db.json`.
3. The route applies validation and business rules.
4. The route writes the updated JSON back to disk when data changes.
5. The route returns the API response.

### Current business logic examples

- Enrollment rule: users cannot enroll in their own course.
- Enrollment rule: duplicate enrollment is rejected.
- Review rule: only enrolled users may leave reviews.
- Review rule: each user may leave one review per course.
- Rating rule: average rating is derived from stored reviews.

## 6. Target Backend Architecture

The target backend architecture should move from route-heavy files to a layered structure.

### Target responsibility model

#### Route layer

- Defines API endpoints
- Applies middleware
- Delegates requests to controllers
- Contains no business logic

#### Controller layer

- Handles request and response flow
- Reads params, query, body, and auth context
- Performs request validation or invokes validation middleware
- Calls service functions
- Maps service outcomes to HTTP responses

#### Service layer

- Contains core business logic
- Enforces rules such as:
  - enrollment eligibility
  - ownership checks
  - one-review-per-user enforcement
  - average rating calculation
- Coordinates multiple repositories or models
- Returns domain results to controllers

#### Data access layer

- Interacts directly with MongoDB models
- Encapsulates database queries and write operations
- Hides storage details from services and controllers
- Supports future query optimization and reuse

#### Model layer

- Defines MongoDB schemas and model relationships
- Represents persistent entities such as:
  - User
  - Course
  - Enrollment
  - Review

## 7. Target Backend Code Layout

Recommended target structure:

```text
server/
  config/
    db.js
  middleware/
    authMiddleware.js
    errorMiddleware.js
    validateRequest.js
  routes/
    auth.routes.js
    users.routes.js
    courses.routes.js
    enrollments.routes.js
    reviews.routes.js
  controllers/
    auth.controller.js
    users.controller.js
    courses.controller.js
    enrollments.controller.js
    reviews.controller.js
  services/
    auth.service.js
    users.service.js
    courses.service.js
    enrollments.service.js
    reviews.service.js
  repositories/
    user.repository.js
    course.repository.js
    enrollment.repository.js
    review.repository.js
  models/
    User.js
    Course.js
    Enrollment.js
    Review.js
  utils/
    errors.js
    response.js
  app.js
  server.js
```

## 8. Target Request Flow

The target backend request flow should be:

```text
HTTP Request
  -> Route
  -> Controller
  -> Service
  -> Repository / Data Access
  -> MongoDB Model
  -> Service
  -> Controller
  -> HTTP Response
```

### Example: enrollment flow

```text
POST /api/courses/:id/enroll
  -> courses route
  -> enrollments controller
  -> enrollments service
  -> enrollment repository + course repository
  -> MongoDB models
  -> response
```

Business rules in the service layer should include:

- reject self-enrollment
- reject duplicate enrollment
- verify course existence
- create enrollment record

### Example: review and rating flow

```text
POST /api/courses/:id/reviews
  -> reviews route
  -> reviews controller
  -> reviews service
  -> review repository + enrollment repository + course repository
  -> MongoDB models
  -> optional course rating recalculation
  -> response
```

Business rules in the service layer should include:

- validate rating range
- verify enrollment status
- prevent duplicate review submission
- update or calculate aggregate rating

## 9. Current vs Target Comparison

| Area | Current State | Target State |
| --- | --- | --- |
| Routing | Routes also contain validation, business logic, and persistence | Routes only declare endpoints and delegate |
| Controllers | Not separated | Dedicated controller per resource |
| Services | Not separated | Business logic lives in services |
| Data access | Direct `db.json` read/write inside routes | Repository or data-access layer talks to MongoDB models |
| Models | No MongoDB model layer | Mongoose or MongoDB models define entities and persistence |
| Scalability | Acceptable for small local workflows | Better for maintainability, testing, and growth |

### Migration direction

The current route files can be decomposed as follows:

- `server/routes/auth.js`
  - move request/response logic to `auth.controller.js`
  - move login/register business rules to `auth.service.js`
  - move user lookup/create operations to `user.repository.js`
- `server/routes/users.js`
  - move profile response handling to `users.controller.js`
  - move profile update and password change rules to `users.service.js`
  - move persistence operations to `user.repository.js`
- `server/routes/courses.js`
  - move course CRUD handlers to `courses.controller.js`
  - move enrollment logic to `enrollments.service.js`
  - move review logic and rating calculation to `reviews.service.js`
  - move course, review, and enrollment data operations to repositories

## 10. Frontend State and Lifecycle Best Practices

The frontend should follow these standards.

### 10.1 State initialization

Use `useEffect` to fetch data when a component mounts or when required dependencies change.

Recommended pattern:

```javascript
useEffect(() => {
  let active = true;

  const loadData = async () => {
    try {
      const res = await api.get('/resource');
      if (active) {
        setData(res.data);
      }
    } catch (err) {
      if (active) {
        setError('Failed to load data');
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  };

  loadData();

  return () => {
    active = false;
  };
}, []);
```

Guidelines:

- initialize `loading`, `error`, and data state explicitly
- fetch inside `useEffect` or a memoized function called by `useEffect`
- avoid hidden side effects in render logic

### 10.2 Memory cleanup

Any `useEffect` that creates long-lived side effects must return a cleanup function.

Use cleanup for:

- event listeners
- subscriptions
- intervals
- timeouts
- manual async guards when needed

Recommended pattern:

```javascript
useEffect(() => {
  const handleResize = () => {
    setWidth(window.innerWidth);
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

This prevents memory leaks and stale updates after unmount.

### 10.3 Global interceptor

Use one centralized HTTP client to attach JWT tokens automatically to all outgoing authenticated requests.

Recommended standard:

- keep token attachment inside `learning-app/src/api/axiosInstance.js`
- use request interceptors instead of mutating global `axios.defaults`
- use response interceptors for shared handling of `401 Unauthorized`
- keep auth storage logic consistent with `AuthContext`

Recommended example:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elearn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 11. Frontend Guidance for This Repository

### Recommended current-project standards

- Keep global auth/session state in `AuthContext.js`.
- Keep page-specific fetched data in the page component unless it must be shared broadly.
- Standardize API calls on `learning-app/src/api/axiosInstance.js`.
- Avoid mixing raw `axios` and the shared API client in the same auth flow.
- Use cleanup functions for any new event listeners, timers, or subscriptions added to the dashboard and other interactive pages.

### Current gap to resolve in future implementation

- `axiosInstance.js` already implements the interceptor pattern.
- `AuthContext.js` should align with that client instead of making raw `axios` calls and setting global defaults separately.
- As the dashboard grows, side effects should be isolated and cleaned up consistently.

## 12. Non-Functional Guidelines

### Maintainability

- Keep routes thin.
- Keep controllers HTTP-focused.
- Keep services business-focused.
- Keep repositories storage-focused.
- Keep frontend API access centralized.

### Testability

- Service logic should be testable without HTTP request objects.
- Repository logic should be testable independently from controllers.
- Frontend data-loading logic should keep loading and error branches explicit.

### Scalability

- Moving to MongoDB enables richer querying and cleaner entity separation.
- Layer separation reduces the cost of adding new domains such as payments, certificates, and progress tracking.

## 13. Comprehensive Evaluation Criteria

This section defines the quality metrics that should be used to evaluate the frontend and backend implementation of the e-learning platform.

### 13.1 Frontend evaluation metrics

#### Component modularity

- UI should be broken into reusable, focused components instead of one oversized page-level implementation.
- Examples of expected reusable units include:
  - `CourseCard`
  - `SearchBar`
  - `ReviewList`
  - `ReviewForm`
  - `ProtectedRoute`
- Each component should have a clear responsibility, stable props, and minimal duplicated markup or logic.

#### Asynchronous UX

- The application should provide clear visual feedback for async operations.
- Each data-driven screen should support:
  - loading state
  - empty-result state
  - error state
- Loading states should prevent confusing blank layouts.
- Empty states should explain that no results were found.
- Error states should display actionable or user-friendly feedback when requests fail.

#### Form validations

- Client-side validation should block submission of incomplete or invalid data.
- Required fields should be validated before the request is sent.
- Invalid values should display clear inline or form-level error messaging.
- Validation should cover common cases such as:
  - missing required fields
  - invalid email format
  - weak password input
  - invalid rating values
  - too-short review text

#### Client routing

- Private routes should be protected with route guards.
- Unauthenticated users should be redirected to the login page when they try to access protected pages such as the dashboard.
- Route guard logic should wait for auth bootstrapping before making the allow-or-redirect decision.
- The current repository already includes this pattern through `ProtectedRoute.jsx`, and future private pages should follow the same standard.

### 13.2 Backend evaluation metrics

#### RESTful API compliance

- Backend routes should follow REST conventions and predictable resource naming.
- Standard examples include:
  - `GET /api/courses`
  - `POST /api/courses`
  - `PUT /api/courses/:id`
  - `DELETE /api/courses/:id`
- Resource-specific nested actions such as enrollment and reviews should remain consistent with the main course resource model.

#### Secure route guards

- Protected routes must validate the JWT before granting access.
- Authorization checks must verify that the user is allowed to modify the target resource.
- Ownership validation is required before update or delete operations on user-owned resources such as courses.
- Enrollment and review actions should also verify domain-specific access rules, not only authentication status.

#### Payload sanitization and HTTP status mapping

- API inputs should be validated and sanitized before persistence or response generation.
- Successful requests should return:
  - `200 OK`
  - `201 Created`
- Invalid input should return:
  - `400 Bad Request`
- Authentication and authorization failures should return:
  - `401 Unauthorized`
  - `403 Forbidden`
- Missing resources should return:
  - `404 Not Found`
- Controllers should map service outcomes to the correct HTTP status rather than returning generic success or failure responses.

#### Database schema optimization

- The target schema design should model relationships explicitly and efficiently.
- Expected reference patterns include:
  - a `Course` references the `User` who created it
  - an `Enrollment` links a `User` to a `Course`
  - a `Review` links a `User` to a `Course`
- Schema design should support:
  - ownership checks
  - enrollment lookups
  - rating aggregation
  - efficient querying for dashboards and course pages

### 13.3 Evaluation outcome standard

An implementation should be considered aligned with this specification when:

- frontend screens use modular reusable components
- async flows expose loading, empty, and error states
- forms prevent invalid client submissions
- private routes are guarded correctly
- backend routes remain RESTful and predictable
- protected APIs enforce authentication and authorization
- HTTP responses use consistent status mapping
- target data models support clean resource relationships and future MongoDB growth

## 14. Implementation Guidance Summary

This repository currently works as:

```text
React frontend + Express backend + db.json persistence
```

The target architecture should evolve toward:

```text
React frontend + centralized API client + Express layered backend + MongoDB
```

The core backend rule is:

```text
route layer -> controller layer -> service layer -> data access layer -> MongoDB model
```

The core frontend rule is:

```text
initialize data in useEffect, clean up side effects, and use a centralized HTTP client to attach JWT automatically
```
