import { HttpErrorResponse } from '@angular/common/http';

/** Shape produced by the backend's GlobalExceptionHandler. */
interface BackendError {
  status?: number;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string> | null;
}

/**
 * Turns an HTTP failure into one line of text a user can act on.
 *
 * GlobalExceptionHandler answers every failure with the same JSON envelope
 * ({ status, error, message, fieldErrors }), so when Bean Validation rejected
 * the payload we show the individual field messages instead of the generic
 * "Validation failed" summary.
 */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    // status 0 means the request never reached the server (CORS/down/offline).
    if (error.status === 0) {
      return 'Cannot reach the API — check that the backend is running.';
    }

    const body = error.error as BackendError | null;
    const fieldErrors = body?.fieldErrors;
    if (fieldErrors && Object.keys(fieldErrors).length) {
      return Object.entries(fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
    }
    if (body?.message) {
      return body.message;
    }
    return `${error.status} ${error.statusText}`;
  }
  return 'Something went wrong. Please try again.';
}
