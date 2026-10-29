import { execSync } from 'node:child_process';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Build number shown in Settings = commit count, so web, OTA and local dev all show it.
// Set as an env var, not in the config: the config feeds the fingerprint, and a per-commit
// value there would give every commit a new runtime version and stop OTA updates.
try {
  process.env.EXPO_PUBLIC_BUILD ??= execSync('git rev-list --count HEAD', { stdio: 'pipe' }).toString().trim();
} catch {} // no git (e.g. some build workers): Settings shows the version alone

export default ({ config }: ConfigContext) => config as ExpoConfig;
