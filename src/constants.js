const httpCodes = {
  ok: 200, // Successful request
  created: 201, // Resource successfully created
  accepted: 202, // Request accepted but not yet processed
  noContent: 204, // Request successful but no content to return
  badRequest: 400, // Client-side error (bad request)
  unauthorized: 401, // Authentication is required and has failed or not provided
  forbidden: 403, // Client does not have access rights
  notFound: 404, // Requested resource not found
  conflict: 409, // Conflict in the current state of the resource
  unprocessableEntity: 422, // Validation error or semantic issues
  tooManyRequests: 429, // Too many requests sent in a given amount of time
  serverSideError: 500, // Internal server error
  notImplemented: 501, // Server does not support the requested functionality
  badGateway: 502, // Invalid response from upstream server
  serviceUnavailable: 503, // Server temporarily unavailable (overload or maintenance)
  gatewayTimeout: 504, // Upstream server failed to respond in time
};
const secureCookieOptions = { httpOnly: true, secure: true };

export { httpCodes, secureCookieOptions };
