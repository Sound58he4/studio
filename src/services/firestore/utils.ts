// src/services/firestore/utils.ts
// REMOVED 'use server'; directive

/**
 * Creates a standardized error object for Firestore service functions.
 *
 * @param message The error message.
 * @param code An optional error code for specific handling.
 * @returns A standard Error object.
 */
export function createFirestoreServiceError(message: string, code: string = 'firestore-error'): Error {
    const error = new Error(message);
    // Add code if needed for specific handling, but keep it as a standard Error
    // (error as any).code = code;
    return error;
}
