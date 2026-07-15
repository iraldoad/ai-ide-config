import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function packageRoot() {
  return path.resolve(__dirname, '..');
}

export function templatesRoot() {
  return path.join(packageRoot(), 'templates');
}

export function sharedTemplatesDir() {
  return path.join(templatesRoot(), 'shared');
}

export function stackTemplatesDir(agentsDir) {
  return path.join(templatesRoot(), agentsDir);
}
