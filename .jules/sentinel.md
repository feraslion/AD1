## 2025-05-18 - Sanitize Global Search Error Responses
**Vulnerability:** Global search endpoint (`src/core/server/routes/v1/search.routes.ts`) exposed raw internal error strings/messages via `details: error?.message || error` in HTTP 500 responses on server errors.
**Learning:** Returning unhandled error properties or stack messages in API route catch blocks leaks internal schema, query structures, and stack traces to potential attackers.
**Prevention:** Omit `details` or raw error strings from HTTP 500 error responses across all API endpoints, logging internal errors server-side only.
