# Version System

## Overview

The app displays the version number at the bottom of the home page. The version automatically increments by 0.1 (patch version) each time you run `npm run build`.

## How It Works

### 1. Version Display Component
- **Location:** `src/components/VersionDisplay.tsx`
- **Display:** Shows `v1.0.0` format
- **Position:** Bottom of home page (below Pro Tip section)

### 2. Version Tracking
- **File:** `package.json` (version field)
- **Format:** Semantic versioning (X.Y.Z)
- **Increments:** Patch version (last number) by 1 on each build
- **Examples:**
  - `1.0.0` → `1.0.1` → `1.0.2` → `1.0.3`
  - `1.0.9` → `1.1.0` (handles overflow)
  - `1.9.9` → `2.0.0` (handles major overflow)

### 3. Build Process

When you run `npm run build`:

1. **Pre-build script** (`prebuild`) runs automatically:
   - Executes `scripts/increment-version.js`
   - Reads current version from `package.json`
   - Increments patch version by 1 (e.g., `1.0.0` → `1.0.1`)
   - Updates `package.json` with new version
   - Logs: `📦 Version incremented: v1.0.0 → v1.0.1`

2. **Build script** runs:
   - `tsc -b` (TypeScript compilation)
   - `vite build` (Vite build)
   - Vite config reads version from `package.json` and injects it as `VITE_APP_VERSION`

3. **Result:**
   - Version is available in the app via `import.meta.env.VITE_APP_VERSION`
   - Displayed at bottom of home page as `v1.0.1`

## Files

- **`package.json`** - Contains version (committed to git)
- **`scripts/increment-version.js`** - Increments version before build
- **`src/utils/version.ts`** - Version utilities
- **`src/components/VersionDisplay.tsx`** - UI component
- **`vite.config.ts`** - Injects version into build

## Usage

### View Current Version
- Look at bottom of home page
- Format: `v1.0.0`

### Increment Version
Just run a build:
```bash
npm run build
```

The version will automatically increment by 0.1 (patch version)!

### Manual Version Update
If you need to set a specific version, edit `package.json`:
```json
{
  "version": "1.2.0"
}
```

The next build will increment from that version.

### Major/Minor Version Bumps
For major or minor version bumps, manually edit `package.json`:
- **Major:** `1.0.0` → `2.0.0` (breaking changes)
- **Minor:** `1.0.0` → `1.1.0` (new features)
- **Patch:** Auto-increments on build (bug fixes, deployments)

## Development vs Production

- **Development (`npm run dev`):** Uses version from `package.json` (doesn't increment)
- **Production (`npm run build`):** Increments version automatically, then builds

## Git Integration

The version in `package.json` is committed to git, so:
- Version is tracked in version control
- Each build increments the version
- Version history is visible in git commits
- Team members see the same version progression

## Vercel Deployment

When Vercel builds your project:
1. Runs `npm run build`
2. Version increments automatically (e.g., `1.0.5` → `1.0.6`)
3. `package.json` is updated with new version
4. Version is displayed in deployed app
5. Git commit shows version bump (if auto-committed)

---

**Note:** The version increments on every build. This means each deployment gets a unique version number, making it easy to track which version is deployed.

