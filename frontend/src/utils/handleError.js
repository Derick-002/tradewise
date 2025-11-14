import { AxiosError } from "axios";

// Prefer backend-provided messages wherever available
export function getBackendMessage(source, fallback = "") {
  try {
    // Axios response object (success path) with GraphQL errors
    if (source?.data?.errors?.length) {
      return source.data.errors[0]?.message || fallback;
    }
    // Axios error.response (error path)
    const res = source?.response || source;
    if (res?.data?.errors?.length) {
      return res.data.errors[0]?.message || fallback;
    }
    if (typeof res?.data?.message === "string" && res.data.message) {
      return res.data.message;
    }
    if (typeof res?.data?.error === "string" && res.data.error) {
      return res.data.error;
    }
  } catch (_) {
    // no-op, fall through to fallback
  }
  return fallback;
}

export function handleError(error) {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const backendMessage = getBackendMessage(error, "Server returned an error");
      return {
        type: "server",
        status,
        message: backendMessage,
        errors: error.response.data?.errors || null,
      };
    } else if (error.request) {
      return {
        type: "network",
        message: "No response received from server",
      };
    } else {
      return {
        type: "config",
        message: error.message,
      };
    }
  }

  if (error instanceof Error) {
    return {
      type: "client",
      message: error.message,
    };
  }

  return {
    type: "unknown",
    message: "An unknown error occurred",
  };
}

// Determine if a response or error contains GraphQL errors
export function isGraphQLError(source) {
  try {
    if (Array.isArray(source?.data?.errors) && source.data.errors.length) return true;
    const res = source?.response || source;
    if (Array.isArray(res?.data?.errors) && res.data.errors.length) return true;
  } catch (_) {
    // ignore
  }
  return false;
}

// Normalize GraphQL errors from either Axios success responses (with data.errors)
// or Axios errors (error.response.data.errors). Always prefers server messages.
export function handleGqlError(source, fallback = "GraphQL request failed") {
  const message = getBackendMessage(source, fallback);
  const res = source?.response || source;
  const errors = res?.data?.errors || source?.data?.errors || null;
  return {
    type: "graphql",
    message,
    errors,
    status: res?.status || null,
  };
}