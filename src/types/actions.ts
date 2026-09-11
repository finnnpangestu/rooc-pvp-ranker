// Standardized Server Action & API Response Contract

export interface ActionSuccess<T = void> {
  success: true
  data: T
  message?: string
}

export interface ActionError {
  success: false
  error: string
  message: string // Alias for compatibility with components checking res.message
  code?: string
  details?: unknown
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionError

/**
 * Creates a standardized successful action result.
 */
export function actionSuccess<T>(data: T, message?: string): ActionSuccess<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  }
}

/**
 * Creates a standardized error action result.
 */
export function actionError(error: string, code?: string, details?: unknown): ActionError {
  return {
    success: false,
    error,
    message: error,
    ...(code ? { code } : {}),
    ...(details !== undefined ? { details } : {}),
  }
}

/**
 * Safely extracts error messages from any caught exception (eliminating `catch (err: any)`).
 */
export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  return 'An unexpected error occurred'
}

/**
 * Automatically maps any caught error to a standardized ActionError,
 * preserving error codes (such as UNAUTHORIZED) for authentication errors.
 */
export function actionFromError(err: unknown, defaultMessage = 'An unexpected error occurred'): ActionError {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return actionError((err as { message?: string }).message || defaultMessage, (err as { code: string }).code)
  }
  if (err instanceof Error) {
    const isAuth =
      err.name === 'UnauthorizedError' ||
      err.message.toLowerCase().includes('login') ||
      err.message.toLowerCase().includes('unauthorized') ||
      err.message.toLowerCase().includes('jwt') ||
      err.message.toLowerCase().includes('token')
    return actionError(err.message, isAuth ? 'UNAUTHORIZED' : undefined)
  }
  return actionError(defaultMessage)
}
