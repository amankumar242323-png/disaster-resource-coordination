\# Assignment 5 â€” HTTP Methods \& Headers



\## Project

\*\*Disaster Resource Coordination API\*\*



\## 1. HTTP Method Map



| Method | Purpose | Expected Success Response | Important Headers |

|---|---|---|---|

| GET | Retrieve reports | 200 OK | ETag, Cache-Control |

| HEAD | Retrieve headers without a response body | Same status as GET | ETag, Cache-Control |

| POST | Create a report | 201 Created | Location |

| PATCH | Partially update a report | 200 OK | ETag |

| OPTIONS | Check supported methods and CORS permissions | 204 No Content | Allow-related and Access-Control headers |

| PUT | Replace a complete resource, if implemented | Not verified | Depends on implementation |

| DELETE | Delete a resource, if implemented | Not verified | Depends on implementation |



The observed CORS configuration advertises GET, HEAD, POST, PATCH and OPTIONS. This does not by itself prove that every method is implemented or that the `Allow` response header is present.



\## 2. Important HTTP Headers



| Header | Purpose |

|---|---|

| Content-Type | Identifies the request or response body format, such as `application/json`. |

| Accept | Specifies the response formats accepted by the client. |

| Authorization | Sends the Bearer token for protected endpoints. |

| Location | Identifies the newly created resource after a successful POST. |

| ETag | Identifies a particular version of a resource. |

| If-None-Match | Allows conditional GET requests and can produce 304 Not Modified. |

| If-Match | Prevents updates based on a stale resource version. |

| Idempotency-Key | Identifies retries of the same create request. |

| Cache-Control | Controls caching behavior. |

| Access-Control-Allow-Origin | Indicates which origins may access a response through CORS. |

| Access-Control-Allow-Methods | Lists methods permitted by the CORS policy. |

| X-RateLimit-Limit | Indicates the configured request limit. |

| X-RateLimit-Remaining | Indicates the remaining request budget. |

| Retry-After | Can tell a client how long to wait after rate limiting. |

| WWW-Authenticate | Provides authentication scheme information when authentication is required. |

| X-Content-Type-Options | `nosniff` helps prevent browsers from interpreting content as a different media type. |



\## 3. Test Results



The following results were observed during local testing.



| Test | Observed Result | Status |

|---|---|---|

| Create a report | 201 Created | PASS |

| Creation response contains Location | `/reports/116` | PASS |

| Repeat POST with the same idempotency key and body | 200 OK | PASS |

| Idempotency replay header | `Idempotency-Replayed: true` | PASS |

| Conditional GET using a matching ETag | 304 Not Modified | PASS |

| Update using a stale If-Match value | 412 Precondition Failed | PASS |

| OPTIONS request | 204 No Content | PASS |

| Browser-style CORS preflight | 204 No Content | PASS |

| Request for a nonexistent report | 404 Not Found | PASS |

| Malformed JSON request | 400 Bad Request | PASS |

| POST without a Bearer token | 401 Unauthorized | PASS |

| POST with an empty Bearer token | 401 Unauthorized | PASS |



\### Important Observations



\- The created report had ID `116`.

\- Repeating the same request returned report ID `116` instead of creating a duplicate.

\- A GET request for report `114` returned `Cache-Control: private, no-cache` and an ETag.

\- A stale conditional update returned `412 Precondition Failed`.

\- A GET request without an Authorization header returned `200 OK`. Therefore, GET authentication has not been demonstrated.

\- The presence of `Access-Control-Allow-Methods` does not prove that an `Allow` header is returned.

\- The 406, 405, 429, HSTS and other untested responses must be verified separately before being reported as passing.



\## 4. Safe and Idempotent Requests



A safe HTTP method does not intentionally change server state. GET is intended for retrieving information, while HEAD retrieves headers without the response body.



An idempotent method produces the same intended server state when the same request is repeated. PUT and DELETE are defined as idempotent by HTTP semantics when implemented according to their intended behavior.



POST is not inherently idempotent. Retrying a POST after a network timeout can create duplicate resources. An idempotency key helps solve this problem by allowing the server to recognize a repeated request.



In this assignment, the same POST body and idempotency key returned the original report with `200 OK` and `Idempotency-Replayed: true`.



\## 5. Conditional Requests and ETags



An ETag is a validator representing a particular version of a resource.



Example:



`ETag: "280962643337e8efe586064e2db4704918ef16ad5243cb324a8a69506f7276e6"`



A client can send this value in `If-None-Match` when retrieving the resource again. If the resource has not changed, the server can return `304 Not Modified` without sending the resource body.



For updates, a client can send the previously retrieved ETag in `If-Match`. If the current version does not match, the server can return `412 Precondition Failed`. This helps prevent lost updates when multiple clients modify the same resource.



\## 6. Error Responses: 400, 401, 404 and 422



\- \*\*400 Bad Request:\*\* The request is malformed. For example, the server returned this status for invalid JSON.

\- \*\*401 Unauthorized:\*\* Authentication credentials are missing or invalid. The tested protected POST endpoint returned this status without a Bearer token.

\- \*\*404 Not Found:\*\* The requested resource does not exist. The request for `/reports/999999` returned this status.

\- \*\*422 Unprocessable Content:\*\* The request format is understood, but the supplied data fails application-level validation. This response still needs to be tested in the current implementation.



A 400 error generally concerns a malformed request, while a 422 error generally concerns syntactically valid content that cannot be processed because of its meaning or validation rules.



\## 7. CORS and Browser Requests



Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls whether a web page can access a response from another origin.



A browser may send an OPTIONS preflight request before sending a cross-origin PATCH request or a request containing certain headers.



The observed response included:



\- `Access-Control-Allow-Origin: \*`

\- `Access-Control-Allow-Methods: GET,HEAD,POST,PATCH,OPTIONS`

\- `Access-Control-Allow-Headers: Content-Type,Accept,Authorization,Idempotency-Key,If-None-Match,If-Match`



A browser can block access to a response even when the server processes the request successfully if the required CORS headers are missing or incorrect. The fix is to configure the server's CORS policy to allow the intended origin, method and headers.



For authenticated requests, using an explicit trusted origin is generally preferable to a wildcard when credentials such as cookies are involved.



\## 8. Cache-Control



Cache-Control specifies how responses may be stored and reused.



\- `no-store` instructs caches not to store the response.

\- `no-cache` permits storage but requires revalidation before reuse.

\- `private` restricts storage to private caches rather than shared caches.



The tested report GET returned `Cache-Control: private, no-cache`, along with an ETag. Other observed responses returned `Cache-Control: no-store`.



\## 9. GET Search Versus POST



GET is appropriate for retrieving and filtering resources when parameters can be represented in the URL, for example:



`GET /reports?severity=HIGH\&limit=10\&offset=0`



GET is safe and supports ordinary HTTP caching semantics. POST is appropriate when submitting data to create a resource or when a search operation requires a request body that is unsuitable for a URL.



POST should not be used for ordinary retrieval without a specific design reason.



\## 10. Location Header and Resource Creation



When a server successfully creates a resource, it commonly returns `201 Created` and a Location header identifying the new resource.



Example:



`HTTP/1.1 201 Created`



`Location: /reports/116`



The client can use this URI to retrieve the newly created report. A Location header identifies a resource; it does not necessarily mean that the client has been redirected. A redirect normally uses a 3xx status code.



\## 11. Safe Retry Plan



1\. Send a POST request with a unique idempotency key and a valid JSON body.

2\. If the server returns 201 Created, record the response and Location header.

3\. If the client times out and does not know whether the request succeeded, retry using the same key and exactly the same body.

4\. If the original request was recorded, the server should return the original result rather than create a duplicate.

5\. If the same key is reused with a different request body, the server should reject the conflicting request.

6\. For conditional updates, retrieve the latest resource and ETag before retrying a failed If-Match request.

7\. Respect rate-limit responses and Retry-After when supplied.

8\. Do not blindly retry non-idempotent requests with a new key after an uncertain network failure.



\## 12. Conclusion



The local tests confirmed report creation, Location headers, idempotency replay, conditional GET, stale conditional-write protection, CORS preflight, malformed JSON handling, missing-resource handling and Bearer authentication for POST requests.



Additional verification is required for PUT, DELETE, 405, 406, 422, 429, the Allow header, production HSTS and any other assignment requirements not covered by the recorded tests.



## Assignment 6 â€” HTTP Status Codes, Validation and Error Handling

### 1. Objective

This assignment improves the Disaster Resource Coordination Field Reports API by providing consistent HTTP status codes, request validation, content negotiation, rate limiting and structured error responses.

### 2. HTTP Status Codes

| Status | Meaning | API usage |
|---|---|---|
| 200 OK | Request succeeded | Retrieve reports or replay an idempotent request |
| 201 Created | Resource created | Create a report or upload a photo |
| 400 Bad Request | Invalid request | Malformed JSON, invalid parameters or invalid idempotency key |
| 404 Not Found | Resource not found | Requested report does not exist |
| 406 Not Acceptable | Unsupported response format | Requested Accept type is not supported |
| 409 Conflict | Request conflicts with existing state | Idempotency key reused with a different payload |
| 413 Payload Too Large | Request exceeds size limit | Oversized photo or request body |
| 422 Unprocessable Content | Validation failed | Invalid report fields |
| 429 Too Many Requests | Rate limit exceeded | Too many requests within the configured time window |
| 500 Internal Server Error | Unexpected server failure | Unhandled server error |
| 503 Service Unavailable | Service dependency unavailable | Database connection failure during health check |

### 3. Problem Details

API errors use a consistent structure containing `type`, `title`, `status` and `detail`. Validation errors may additionally contain an `errors` array with field names and messages.

The JSON error media type is `application/problem+json`. XML error representations are supported on routes that use content negotiation.

### 4. Request Validation

The report creation endpoint validates the request before attempting report creation. It checks positive integer identifiers, report type length, severity, description and occupancy count.

Invalid report fields return `422 Unprocessable Content`. Malformed JSON, an invalid request object or an invalid idempotency key return `400 Bad Request`.

### 5. Content Negotiation

JSON is the default response format. Clients can request XML using `Accept: application/xml` or `Accept: text/xml`. Unsupported Accept values are intended to produce `406 Not Acceptable`.

### 6. Rate Limiting and Retry Behaviour

The reports API uses a configurable rate limit, defaulting to 100 requests per minute. In the test environment, requests with `X-Test-Rate-Key` use an isolated counter with a limit of two requests.

A rate-limit response returns `429 Too Many Requests` with `Retry-After: 60`. The health endpoint returns `503 Service Unavailable` with `Retry-After: 30` when its database check fails.

Clients should respect Retry-After rather than retrying continuously.

### 7. Idempotency

Report creation requires a UUID `Idempotency-Key`. Repeating a request with the same key and equivalent payload is intended to avoid duplicate creation. Reusing the key with a different payload returns `409 Conflict`.

Clients should reuse the same key and request body when retrying after an uncertain network failure.

### 8. Automated Testing

The existing automated test suite completed successfully with 16 passing tests, including report operations, photo uploads and rate limiting.

Additional manual verification should cover unsupported Accept values, malformed JSON, invalid report fields, unknown report IDs, idempotency conflicts and health-check failure responses.

### 9. Specification and Verification

The OpenAPI document is maintained at `reports/openapi.yaml`. Documentation describes intended API behaviour; actual responses must be verified through tests or recorded HTTP requests before being claimed as passing.
