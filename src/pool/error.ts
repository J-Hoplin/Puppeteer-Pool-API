/**
 * Exception for pool not initialized
 */
export class PoolNotInitializedException extends Error {
  constructor() {
    super('Pool not initialized! Please initialize pool first!');
    this.name = 'PoolNotInitializedException';
  }
}

/**
 * Exception for session callback function
 */
export class SessionCallbackException extends Error {
  constructor(message: string) {
    super(`Exception occured while callback: ${message}`);
    this.name = 'SessionCallbackException';
  }
}
