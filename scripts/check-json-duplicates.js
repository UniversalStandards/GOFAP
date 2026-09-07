import { readFile } from 'node:fs/promises';

import duplicateKeyValidator from 'json-dup-key-validator';

const defaultManifestPaths = ['package.json'];
const manifestPaths = process.argv.slice(2);
const pathsToValidate = manifestPaths.length > 0 ? manifestPaths : defaultManifestPaths;
let hasErrors = false;

for (const manifestPath of pathsToValidate) {
  try {
    const manifest = await readFile(manifestPath, 'utf8');
    const validationError = duplicateKeyValidator.validate(manifest, false);

    if (validationError) {
      hasErrors = true;
      console.error(`${manifestPath}: ${validationError}`);
    }
  } catch (error) {
    hasErrors = true;
    console.error(`${manifestPath}: ${error.message}`);
  }
}

if (hasErrors) {
  process.exitCode = 1;
} else {
  console.log(`Validated ${pathsToValidate.length} JSON manifest(s): no duplicate keys found.`);
}
