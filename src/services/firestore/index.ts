// src/services/firestore/index.ts

// This file acts as a central barrel file for all Firestore service functions.
// It should NOT have 'use server'; itself. Individual service files do.

// Export functions from profileService.ts
export * from './profileService';

// Export functions from logService.ts
export * from './logService';

// Export functions from workoutService.ts
export * from './workoutService';

// Export functions from socialService.ts
export * from './socialService';

// Export functions from chatService.ts
export * from './chatService';

// Export functions from quickLogService.ts
export * from './quickLogService';

// Export functions from pointsService.ts
export * from './pointsService';

// DO NOT re-export synchronous utility functions like createFirestoreServiceError from here
// if this barrel file is implicitly treated as a 'use server' module due to its other re-exports.
// Components should import utils directly.
// createFirestoreServiceError is now imported directly from './utils' where needed.
