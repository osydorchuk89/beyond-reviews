export class ServiceError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const getErrorStatusCode = (error: unknown) =>
    error instanceof ServiceError ? error.statusCode : 500;

export const getErrorMessage = (error: unknown, fallbackMessage: string) =>
    error instanceof ServiceError ? error.message : fallbackMessage;
