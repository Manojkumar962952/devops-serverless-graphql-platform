const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const functions = [
  'createEmployee',
  'getEmployees',
  'getEmployee',
  'updateEmployee',
  'deleteEmployee',
  'initDatabase',
];

async function buildAll() {
  console.log('🚀 Starting Lambda bundle compilation with esbuild...\n');

  for (const fn of functions) {
    const entryPoint = path.join(__dirname, fn, 'index.ts');
    const outdir = path.join(__dirname, 'dist', fn);

    if (!fs.existsSync(entryPoint)) {
      console.error(`❌ Entry point not found: ${entryPoint}`);
      continue;
    }

    try {
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        platform: 'node',
        target: 'node24',
        outfile: path.join(outdir, 'index.js'),
        format: 'cjs',
        sourcemap: false,
        minify: true,
        // @aws-sdk is provided natively in AWS Lambda Node.js 18+ runtime
        external: ['@aws-sdk/*'],
      });
      console.log(`✅ Successfully bundled ${fn} -> dist/${fn}/index.js`);
    } catch (err) {
      console.error(`❌ Failed to bundle ${fn}:`, err);
      process.exit(1);
    }
  }

  console.log('\n🎉 All Lambda functions compiled successfully!');
}

buildAll();
