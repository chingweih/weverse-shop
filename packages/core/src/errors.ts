import type { ZodIssue } from 'zod'

export class WeverseShopError extends Error {
  public readonly code: string
  public override readonly cause?: unknown

  constructor(message: string, code: string, cause?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.cause = cause
    Error.captureStackTrace(this, this.constructor)
  }
}

export class HttpFetchError extends WeverseShopError {
  public readonly status: number
  public readonly statusText: string
  public readonly url: string
  public readonly responseBody: string

  constructor(params: {
    status: number
    statusText: string
    url: string
    responseBody: string
  }) {
    const truncatedBody =
      params.responseBody.length > 1000
        ? params.responseBody.slice(0, 1000) + '... (truncated)'
        : params.responseBody

    const message =
      `Failed to fetch data (HTTP ${params.status}): ${params.statusText}\n` +
      `URL: ${params.url}\n` +
      `Response: ${truncatedBody}`

    super(message, 'WEVERSE_HTTP_ERROR')

    this.status = params.status
    this.statusText = params.statusText
    this.url = params.url
    this.responseBody = truncatedBody
  }
}

export class InvalidResponseStructureError extends WeverseShopError {
  public readonly receivedData: unknown

  constructor(message: string, receivedData: unknown) {
    super(message, 'WEVERSE_INVALID_RESPONSE')
    this.receivedData = receivedData
  }
}

export class SaleNotFoundError extends WeverseShopError {
  public readonly saleId: number
  public readonly availableQueryKeys: string[]

  constructor(saleId: number, availableQueryKeys: string[]) {
    const message =
      `Sale data not found in response.\n` +
      `Sale ID: ${saleId}\n` +
      `Could not find query with key "GET:/api/v1/sales/:saleId".\n` +
      `Available query keys: ${availableQueryKeys.join(', ')}`

    super(message, 'WEVERSE_SALE_NOT_FOUND')

    this.saleId = saleId
    this.availableQueryKeys = availableQueryKeys
  }
}

export class ValidationError extends WeverseShopError {
  public readonly issues: ZodIssue[]
  public readonly rawData: unknown

  constructor(issues: ZodIssue[], rawData: unknown) {
    const message =
      'Failed to validate sale data structure.\n' +
      'Validation errors:\n' +
      issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')

    super(message, 'WEVERSE_VALIDATION_ERROR')

    this.issues = issues
    this.rawData = rawData
  }
}

export class BuildIdExtractionError extends WeverseShopError {
  public readonly htmlSnippet: string

  constructor(htmlContent: string) {
    const snippet =
      htmlContent.length > 500
        ? htmlContent.slice(0, 500) + '... (truncated)'
        : htmlContent

    const message =
      'Failed to extract buildId from Weverse Shop homepage.\n' +
      'The page structure may have changed. Please report this issue.\n' +
      `HTML snippet: ${snippet}`

    super(message, 'WEVERSE_BUILDID_EXTRACTION_ERROR')

    this.htmlSnippet = snippet
  }
}
