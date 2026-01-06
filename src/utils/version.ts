/**
 * Version Utilities
 * Tracks app version for display
 * 
 * This file imports from version.generated.ts which is auto-generated during build
 */

// Import from generated file (created by prebuild script)
// @ts-ignore - File is generated, may not exist in IDE
import { APP_VERSION as GeneratedVersion, getVersionString as GeneratedGetVersionString } from './version.generated';

// Re-export from generated file
export const APP_VERSION = GeneratedVersion;
export const getVersionString = GeneratedGetVersionString;

