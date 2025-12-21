const esbuild = require('esbuild');
const { glob } = require('glob');
const path = require('path');

async function build() {
  // Find all node and credential TypeScript files
  const nodeFiles = await glob('nodes/**/*.node.ts');
  const credentialFiles = await glob('credentials/**/*.credentials.ts');
  const allFiles = [...nodeFiles, ...credentialFiles];

  console.log('Building files:', allFiles);

  // External packages provided by n8n at runtime - do NOT bundle these
  const external = [
    'n8n-workflow',
    'n8n-core',
    '@langchain/core',
    '@langchain/core/*',
    '@langchain/classic',
    '@langchain/classic/*',
    '@langchain/openai',
    'langchain',
    'langchain/*',
    'zod',
    '@n8n/json-schema-to-zod',
  ];

  for (const file of allFiles) {
    const outfile = file
      .replace(/^nodes\//, 'dist/nodes/')
      .replace(/^credentials\//, 'dist/credentials/')
      .replace(/\.ts$/, '.js');

    await esbuild.build({
      entryPoints: [file],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile,
      external,
      keepNames: true,
      logLevel: 'info',
    });
    console.log(`Built: ${outfile}`);
  }

  console.log('Build complete!');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
