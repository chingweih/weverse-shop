export class InvalidUrlError extends Error {
  readonly name = 'InvalidUrlError' as const
  constructor(url: string) {
    super(`Invalid URL format: ${url}`)
  }
}

export class InvalidInputError extends Error {
  readonly name = 'InvalidInputError' as const
  constructor(input: string) {
    super(`Invalid input: ${input}`)
  }
}

export class SaleNotFoundError extends Error {
  readonly name = 'SaleNotFoundError' as const
  constructor(saleId: string) {
    super(`Sale not found: ${saleId}`)
  }
}

export class DatabaseError extends Error {
  readonly name = 'DatabaseError' as const
  constructor(operation: string, cause: unknown) {
    super(`Database operation failed: ${operation}`)
    this.cause = cause
  }
}

export class AuthorizationError extends Error {
  readonly name = 'AuthorizationError' as const
  constructor(message: string) {
    super(`Not authorized: ${message}`)
  }
}

export class AuthenticationError extends Error {
  readonly name = 'AuthenticationError' as const
  constructor(message: string) {
    super(`Not logged in: ${message}`)
  }
}

export class LineError extends Error {
  readonly name = 'LineError' as const
  constructor() {
    super('Line error')
  }
}
