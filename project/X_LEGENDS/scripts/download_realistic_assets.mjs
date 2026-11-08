import fs from 'node:fs/promises';
import path from 'node:path';

const assets = [
  { name: 'smithy', url: 'https://cdn.3dassets.dev/assets/37609/v1/model.glb', triangles: '42,072' },
  { name: 'cloister', url: 'https://cdn.3dassets.dev/assets/37430/v1/model.glb', triangles: '195,904' },
  { name: 'bell_tower', url: 'https://cdn.3dassets.dev/assets/37382/v1/model.glb', triangles: '16,600' },
];
const outputDir = path.resolve('public/assets/models/realistic');
await fs.mkdir(outputDir, { recursive: true });

for (const asset of assets) {
  const destination = path.join(outputDir, `${asset.name}.glb`);
  console.log(`Downloading ${asset.name} (${asset.triangles} triangles)...`);
  const response = await fetch(asset.url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`${asset.name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error(`${asset.name}: response is not a valid binary GLB`);
  }
  await fs.writeFile(destination, bytes);
  console.log(`Saved ${destination} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);
}
console.log('All realistic medieval models downloaded. Restart the dev server to load them.');
