const fs = require('licia/fs');
const path = require('path');

async function copyDefinition() {
  const data = await fs.readFile(path.resolve(__dirname, '../src/index.d.ts'));
  await fs.writeFile(path.resolve(__dirname, '../dist/chobitsu.d.ts'), data);
}

copyDefinition();
