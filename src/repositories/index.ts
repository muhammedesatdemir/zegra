/**
 * Repository exports
 *
 * Production: FileRepository (persistent, expo-file-system based)
 * Testing: MemoryRepository (in-memory, no native dependency)
 */

export type { IScheduleRepository, StorageData } from './types';
export { MemoryRepository, createTestRepository } from './memoryRepository';

// ============================================
// DEFAULT REPOSITORY
// ============================================

import type { IScheduleRepository } from './types';
import { getFileRepository } from './fileRepository';

/**
 * Get the app's repository instance.
 *
 * Uses FileRepository for persistent local storage.
 * First call triggers sync load from disk.
 */
export function getRepository(): IScheduleRepository {
  return getFileRepository();
}
