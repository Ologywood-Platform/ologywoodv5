export type CompletedUpload = {
  success: true;
  fileKey: string;
  url: string;
  fileSizeBytes: number;
  fileFormat: string;
};

const DEFAULT_UPLOAD_ERROR = "We couldn't upload this file. Please try again.";
const INVALID_UPLOAD_RESPONSE = "The upload service returned an invalid response. Please try again.";

/** An intentionally safe error for displaying upload failures to a user. */
export class UploadResponseError extends Error {
  readonly status: number;

  constructor(status: number, message = getUploadStatusMessage(status)) {
    super(message);
    this.name = "UploadResponseError";
    this.status = status;
  }
}

/**
 * Public, action-oriented messages only. Never use a response body as an error
 * message: proxies and upstream services can include HTML or implementation details.
 */
export function getUploadStatusMessage(status: number): string {
  switch (status) {
    case 0:
      return "We couldn't reach the upload service. Check your connection and try again.";
    case 400:
      return "The upload request was invalid. Check the file and try again.";
    case 401:
      return "Please sign in again before uploading a file.";
    case 403:
      return "You don't have permission to upload this file.";
    case 413:
      return "This file is too large to upload. Choose a smaller file and try again.";
    case 500:
      return "We couldn't process that upload. Please try again.";
    case 502:
    case 503:
      return "The upload service is temporarily unavailable. Please try again shortly.";
    case 504:
      return "The upload timed out. Check your connection and try again.";
    default:
      return DEFAULT_UPLOAD_ERROR;
  }
}

export function getSafeUploadErrorMessage(error: unknown): string {
  if (error instanceof UploadResponseError) return error.message;
  if (error instanceof DOMException && error.name === "AbortError") {
    return "The upload was cancelled.";
  }
  return getUploadStatusMessage(0);
}

export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("application/json") || contentType.includes("+json");
}

/**
 * Safely read a JSON endpoint response. HTTP, content type, and malformed JSON
 * failures are deliberately translated to a stable public message rather than
 * exposing an upstream response body.
 */
export async function readUploadResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new UploadResponseError(response.status);
  }

  if (!isJsonResponse(response)) {
    throw new UploadResponseError(response.status, INVALID_UPLOAD_RESPONSE);
  }

  try {
    return await response.json() as T;
  } catch {
    throw new UploadResponseError(response.status, INVALID_UPLOAD_RESPONSE);
  }
}

function isCompletedUpload(value: unknown): value is CompletedUpload {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return result.success === true
    && typeof result.fileKey === "string" && result.fileKey.length > 0
    && typeof result.url === "string" && result.url.length > 0
    && typeof result.fileSizeBytes === "number" && Number.isFinite(result.fileSizeBytes) && result.fileSizeBytes >= 0
    && typeof result.fileFormat === "string" && result.fileFormat.length > 0;
}

/**
 * Reads the completion payload for a media upload. A successful HTTP response is
 * not treated as a successful upload until its JSON body matches the completion
 * contract exactly enough to be usable by callers.
 */
export async function parseUploadResponse(response: Response): Promise<CompletedUpload> {
  const payload = await readUploadResponse<unknown>(response);

  if (!isCompletedUpload(payload)) {
    throw new UploadResponseError(response.status, INVALID_UPLOAD_RESPONSE);
  }

  return payload;
}

function trpcErrorDetails(status: number) {
  switch (status) {
    case 401:
      return { code: -32001, trpcCode: "UNAUTHORIZED" };
    case 403:
      return { code: -32003, trpcCode: "FORBIDDEN" };
    case 413:
      return { code: -32013, trpcCode: "PAYLOAD_TOO_LARGE" };
    default:
      return { code: -32603, trpcCode: "INTERNAL_SERVER_ERROR" };
  }
}

/**
 * Converts an HTML or plain-text gateway response into the envelope expected by
 * the tRPC client. Auth and payload status codes are retained so callers can
 * still distinguish them from an ordinary transient server failure.
 */
export function normalizeTrpcNonJsonResponse(response: Response): Response {
  if (isJsonResponse(response)) return response;

  const status = [401, 403, 413].includes(response.status)
    ? response.status
    : response.status >= 400 ? response.status : 503;
  const details = trpcErrorDetails(status);

  return new Response(
    JSON.stringify({
      error: {
        json: {
          message: getUploadStatusMessage(status),
          code: details.code,
          data: { code: details.trpcCode, httpStatus: status },
        },
      },
    }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

/** Error gateways sometimes label a plain-text body as JSON. Validate error bodies without consuming the original. */
export async function normalizeTrpcResponse(response: Response): Promise<Response> {
  if (!isJsonResponse(response)) return normalizeTrpcNonJsonResponse(response);
  if (!response.ok) {
    try { await response.clone().json(); }
    catch { return normalizeTrpcNonJsonResponse(new Response('', { status: response.status })); }
  }
  return response;
}
