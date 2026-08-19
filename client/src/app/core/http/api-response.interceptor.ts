import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { ApiEnvelope, ApiError } from '../models/common.model';

interface SpringPageBody {
  content: unknown[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

function isSpringPageBody(body: unknown): body is SpringPageBody {
  return (
    !!body &&
    typeof body === 'object' &&
    Array.isArray((body as SpringPageBody).content) &&
    typeof (body as SpringPageBody).page === 'object'
  );
}

/** Spring Data nests pagination metadata under `page`; the client's Page<T> model expects it flat. */
function flattenSpringPage(body: SpringPageBody) {
  const { content, page } = body;
  return {
    content,
    number: page.number,
    size: page.size,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    first: page.number === 0,
    last: page.number >= page.totalPages - 1,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

/**
 * Unwraps the platform-wide {success, status, message, data, timestamp}
 * envelope so every service just works with the plain payload, and
 * normalizes every error (including network failures) into a plain
 * {status, message} object components can render directly.
 */
export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object' && 'data' in event.body) {
        const envelope = event.body as ApiEnvelope<unknown>;
        const data = isSpringPageBody(envelope.data) ? flattenSpringPage(envelope.data) : envelope.data;
        return event.clone({ body: data });
      }
      return event;
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const envelope = error.error as Partial<ApiEnvelope<unknown>> | undefined;
        const apiError: ApiError = {
          status: error.status,
          message:
            envelope?.message ||
            (error.status === 0 ? 'Cannot reach the server. Is the backend running?' : error.message),
        };
        return throwError(() => apiError);
      }
      return throwError(() => ({ status: 0, message: 'Unexpected error' }) as ApiError);
    }),
  );
};
