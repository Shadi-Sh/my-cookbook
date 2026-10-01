import { createRequire } from 'node:module';
import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const root = join(import.meta.dirname, '..', 'public', 'ocr');
await mkdir(join(root,'core'), {recursive:true});
await mkdir(join(root,'lang'), {recursive:true});
const js = dirname(require.resolve('tesseract.js/package.json'));
const core = dirname(createRequire(require.resolve('tesseract.js/package.json')).resolve('tesseract.js-core/package.json'));
await copyFile(join(js,'dist','worker.min.js'), join(root,'worker.min.js'));
await copyFile(join(js,'LICENSE.md'), join(root,'LICENSE-tesseract.js'));
await copyFile(join(core,'LICENSE'), join(root,'LICENSE-tesseract-core'));
for (const file of await readdir(core)) if (/\.wasm(?:\.js)?$/.test(file)) await copyFile(join(core,file),join(root,'core',file));
for (const code of ['eng','deu','fas']) {
  const {langPath} = require('@tesseract.js-data/'+code);
  await copyFile(join(langPath,code+'.traineddata.gz'),join(root,'lang',code+'.traineddata.gz'));
}
console.log('Prepared same-origin OCR assets for German, English and Persian.');
