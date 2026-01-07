/**
 * Version Utilities
 * Tracks app version and build number for display
 * 
 * This file imports from build-info.generated.ts which is auto-generated during build
 */

// Import from generated file (created by prebuild script)
// @ts-ignore - File is generated during build, may not exist in IDE
import { 
  APP_VERSION, 
  BUILD_NUMBER, 
  BUILD_DATE,
  getVersionString,
  getVersionOnly,
  getBuildNumber
} from './build-info.generated';

// Re-export from generated file
export { APP_VERSION, BUILD_NUMBER, BUILD_DATE, getVersionString, getVersionOnly, getBuildNumber };

