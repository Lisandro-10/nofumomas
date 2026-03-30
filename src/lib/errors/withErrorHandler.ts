import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./index";

type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> },
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js Route Handler with centralized error handling.
 *
 * - AppError instances → RFC 9457 structured JSON response with the error's status code.
 * - Unknown errors → console.error + generic 500 (no stack trace leak).
 *
 * NOTE: Do NOT use this wrapper on routes that intentionally return { ok: true } for
 * all outcomes for security reasons (e.g. forgot-password, resend-activation).
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?) => {
    try {
      return await handler(req, context);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          {
            type: "about:blank",
            title: err.message,
            status: err.statusCode,
          },
          { status: err.statusCode },
        );
      }

      console.error(`[${req.nextUrl.pathname}]`, err);
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Error interno del servidor",
          status: 500,
        },
        { status: 500 },
      );
    }
  };
}
