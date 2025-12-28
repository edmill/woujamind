/**
 * LocalStorage Migration Utility
 * Migrates from old "sprite_magic_*" keys to new "woujamind_*" keys
 */

const OLD_TO_NEW_KEYS: Record<string, string> = {
  'sprite_magic_api_key': 'woujamind_api_key',
  'sprite_magic_gemini_25_rules': 'woujamind_gemini_25_rules',
  'sprite_magic_gemini_30_rules': 'woujamind_gemini_30_rules',
  'sprite_magic_default_background_type': 'woujamind_default_background_type',
  'sprite_magic_default_background_color': 'woujamind_default_background_color',
  'sprite_magic_default_background_image': 'woujamind_default_background_image',
};

const MIGRATION_FLAG_KEY = 'woujamind_migration_completed';

/**
 * Migrates all localStorage keys from old naming scheme to new one
 * This preserves user settings when upgrading to the new branding
 */
export function migrateLocalStorage(): void {
  // Check if migration has already been completed
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    return; // Migration already done
  }

  console.log('[Migration] Starting localStorage migration from sprite_magic_* to woujamind_*');

  let migratedCount = 0;

  // Iterate through all old keys and migrate them
  Object.entries(OLD_TO_NEW_KEYS).forEach(([oldKey, newKey]) => {
    const oldValue = localStorage.getItem(oldKey);

    if (oldValue !== null) {
      // Only migrate if the new key doesn't already exist
      const newValue = localStorage.getItem(newKey);
      if (newValue === null) {
        localStorage.setItem(newKey, oldValue);
        migratedCount++;
        console.log(`[Migration] Migrated ${oldKey} -> ${newKey}`);
      } else {
        console.log(`[Migration] Skipped ${oldKey} (new key already exists)`);
      }

      // Optionally remove old key (commented out for backwards compatibility)
      // localStorage.removeItem(oldKey);
    }
  });

  // Set migration flag so we don't run this again
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

  console.log(`[Migration] Completed. Migrated ${migratedCount} keys.`);
}
