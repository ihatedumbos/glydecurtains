import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

/**
 * Backend field error shape returned by the API's GlobalExceptionHandler.
 */
export interface BackendFieldError {
  field: string;
  message: string;
}

/**
 * Maps backend field validation errors to React Hook Form field errors.
 *
 * Usage:
 * ```ts
 * catch (err) {
 *   const fieldErrors = err.response?.data?.fieldErrors;
 *   if (fieldErrors) {
 *     mapBackendErrors(fieldErrors, setError);
 *   }
 * }
 * ```
 */
export function mapBackendErrors<T extends FieldValues>(
  fieldErrors: BackendFieldError[],
  setError: UseFormSetError<T>,
): void {
  fieldErrors.forEach(({ field, message }) => {
    setError(field as Path<T>, {
      type: 'server',
      message,
    });
  });
}

/**
 * Extracts field errors from an axios error response, if present.
 */
export function extractFieldErrors(error: unknown): BackendFieldError[] | null {
  const err = error as {
    response?: { data?: { fieldErrors?: BackendFieldError[] } };
  };
  return err?.response?.data?.fieldErrors ?? null;
}

/**
 * Extracts the error message from an axios error response.
 */
export function extractErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  const err = error as {
    response?: { data?: { message?: string } };
  };
  return err?.response?.data?.message ?? fallback;
}
