import type { Express, Request, Response } from "express";

/**
 * OAuth Error Handler Middleware
 * Provides better error messages and retry guidance for OAuth failures
 */

export interface OAuthError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction: string;
}

const oauthErrorMap: Record<string, OAuthError> = {
  INVALID_CODE: {
    code: "INVALID_CODE",
    message: "OAuth code is invalid or expired",
    userMessage: "The authentication code has expired. Please try signing in again.",
    retryable: true,
    suggestedAction: "Click 'Sign In' to try again",
  },
  INVALID_STATE: {
    code: "INVALID_STATE",
    message: "OAuth state parameter mismatch",
    userMessage: "There was a security validation issue. Please try signing in again.",
    retryable: true,
    suggestedAction: "Click 'Sign In' to try again",
  },
  MISSING_EMAIL: {
    code: "MISSING_EMAIL",
    message: "User email not provided by OAuth provider",
    userMessage: "We couldn't retrieve your email from the authentication service.",
    retryable: true,
    suggestedAction: "Try signing in with a different method or contact support",
  },
  EMAIL_DELIVERY_FAILED: {
    code: "EMAIL_DELIVERY_FAILED",
    message: "Failed to deliver authentication email",
    userMessage: "We couldn't send the verification email. Please check your email address and try again.",
    retryable: true,
    suggestedAction: "Verify your email address and try again in a few moments",
  },
  SESSION_CREATION_FAILED: {
    code: "SESSION_CREATION_FAILED",
    message: "Failed to create user session",
    userMessage: "We couldn't create your session. Please try signing in again.",
    retryable: true,
    suggestedAction: "Try signing in again or contact support if the problem persists",
  },
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    message: "Network error during OAuth flow",
    userMessage: "There was a connection issue. Please check your internet and try again.",
    retryable: true,
    suggestedAction: "Check your internet connection and try again",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    message: "Unknown OAuth error occurred",
    userMessage: "An unexpected error occurred during sign in.",
    retryable: true,
    suggestedAction: "Try again or contact support if the problem persists",
  },
};

export function getOAuthError(errorCode: string): OAuthError {
  return oauthErrorMap[errorCode] || oauthErrorMap.UNKNOWN_ERROR;
}

export function registerOAuthErrorHandler(app: Express) {
  app.get("/api/oauth/error", (req: Request, res: Response) => {
    const errorCode = req.query.error as string || "UNKNOWN_ERROR";
    const error = getOAuthError(errorCode);

    res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.userMessage,
        retryable: error.retryable,
        suggestedAction: error.suggestedAction,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Enhanced callback error handling
  app.get("/api/oauth/callback", async (req: Request, res: Response, next) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      // Handle OAuth provider errors
      if (error) {
        const errorDescription = req.query.error_description as string;
        console.error("[OAuth] Provider error:", error, errorDescription);

        // Redirect to error page with details
        const errorCode = error === "access_denied" ? "INVALID_CODE" : "UNKNOWN_ERROR";
        return res.redirect(`/?oauth_error=${errorCode}`);
      }

      if (!code || !state) {
        return res.redirect("/?oauth_error=INVALID_CODE");
      }

      // Continue with normal OAuth flow
      next();
    } catch (error) {
      console.error("[OAuth] Error handler failed:", error);
      res.redirect("/?oauth_error=UNKNOWN_ERROR");
    }
  });
}

/**
 * Client-side OAuth error display component
 * This should be used in the Home or Login page to show errors
 */
export function getOAuthErrorDisplay(errorCode?: string) {
  if (!errorCode) return null;

  const error = getOAuthError(errorCode);
  return {
    title: "Sign In Failed",
    message: error.userMessage,
    action: error.suggestedAction,
    retryable: error.retryable,
  };
}
