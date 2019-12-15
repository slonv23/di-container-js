/* eslint-env node */
const { writeFileSync, copyFileSync } = require('fs');
const { resolve, join } = require('path');
// @ts-ignore
const packageJson = require('../package.json');

main();

function main() {
  const projectRoot = resolve(__dirname, '..');
  const distPath = resolve(projectRoot, 'dist');
  const distPackageJson = createDistPackageJson(packageJson);

  copyFileSync(resolve(projectRoot, 'README.md'), resolve(distPath, 'README.md'));
  copyFileSync(resolve(join(projectRoot, 'src'), 'index.d.ts'), resolve(distPath, 'index.d.ts'));
  writeFileSync(resolve(distPath, 'package.json'), distPackageJson);
}

/**
 * @param {typeof packageJson} packageConfig
 * @returns {string}
 */
function createDistPackageJson(packageConfig) {
  // eslint-disable-next-line no-unused-vars
  const {devDependencies, scripts, ...distPackageJson} = packageConfig;

  return JSON.stringify(distPackageJson, null, 2);
}