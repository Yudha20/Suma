import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const nvmrcPath = resolve(process.cwd(), '.nvmrc');

let requiredRaw = '';
try {
  requiredRaw = readFileSync(nvmrcPath, 'utf8').trim();
} catch {
  process.exit(0);
}

const requiredMajor = Number.parseInt(requiredRaw.replace(/^v/i, ''), 10);
const currentMajor = Number.parseInt(process.versions.node.split('.')[0], 10);

if (!Number.isFinite(requiredMajor)) {
  process.exit(0);
}

if (currentMajor !== requiredMajor) {
  const message = [
    `Unsupported Node.js runtime detected: ${process.version}.`,
    `This project expects Node ${requiredMajor}.x (from .nvmrc).`,
    'Run `nvm install && nvm use` and restart the dev server.'
  ].join('\n');
  console.error(message);
  process.exit(1);
}
