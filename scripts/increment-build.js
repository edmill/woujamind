#!/usr/bin/env node
/**
 * Increment Version Script
 * Runs before build to increment the version by 0.1
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const packageJsonPath = join(projectRoot, 'package.json');

// Read package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Parse current version
const currentVersion = packageJson.version || '1.0.0';
const versionParts = currentVersion.split('.').map(Number);

// Increment patch version by 0.1 (increment last part by 1)
// e.g., 1.0.0 → 1.0.1, 1.0.9 → 1.1.0, 1.9.9 → 2.0.0
versionParts[2] = (versionParts[2] || 0) + 1;

// Handle overflow
if (versionParts[2] >= 10) {
  versionParts[2] = 0;
  versionParts[1] = (versionParts[1] || 0) + 1;
  if (versionParts[1] >= 10) {
    versionParts[1] = 0;
    versionParts[0] = (versionParts[0] || 1) + 1;
  }
}

// Ensure we have 3 parts
while (versionParts.length < 3) {
  versionParts.push(0);
}

const newVersion = versionParts.join('.');

// Update package.json
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

console.log(`📦 Version incremented: v${currentVersion} → v${newVersion}`);

