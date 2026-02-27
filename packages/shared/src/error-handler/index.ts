

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this);
  }
}

// Not Found Error
export class NotFoundError extends APIError {
  constructor(message = "Resources not found") {
    super(message, 404);
  }
}

// Authorization Error
export class AuthorizationError extends APIError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

// Validation Error
export class ValidationError extends APIError {
  constructor(message = "Invalid data", details?: any) {
    super(message, 400, true, details);
  }
}

// Forbidden Error
export class ForbiddenError extends APIError {
  constructor(message = "Forbidden access") {
    super(message, 403);
  }
}

// Database Error mongo/postgres
export class DatabaseError extends APIError {
  constructor(message = "Database error", details?: any) {
    super(message, 500, true, details);
  }
}

// Rate Limit
export class RateLimit extends APIError {
  constructor(message = "Too many requests. Please try again") {
    super(message, 429);
  }
}
