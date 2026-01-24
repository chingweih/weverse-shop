export class MessageTypeNotSupportedError extends Error {
  readonly name = 'MessageTypeNotSupportedError' as const
  constructor(type: string) {
    super(`Message type ${type} not supported`)
  }
}
