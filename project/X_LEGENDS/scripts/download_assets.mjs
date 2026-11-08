import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL_MEDIEVAL = 'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0/main/addons/kaykit_medieval_hexagon_pack/Assets/gltf';
const BASE_URL_TEXTURE = `${BASE_URL_MEDIEVAL}/buildings/blue/hexagons_medieval.png`;

const BUILDINGS = [
  { name: 'building_tavern', file: 'building_tavern_blue', folder: 'buildings/blue' },
  { name: 'building_blacksmith', file: 'building_blacksmith_blue', folder: 'buildings/blue' },
  { name: 'building_church', file: 'building_church_blue', folder: 'buildings/blue' },
  { name: 'building_market', file: 'building_market_blue', folder: 'buildings/blue' },
  { name: 'building_home_A', file: 'building_home_A_blue', folder: 'buildings/blue' },
  { name: 'building_home_B', file: 'building_home_B_blue', folder: 'buildings/blue' },
  { name: 'building_castle', file: 'building_castle_blue', folder: 'buildings/blue' },
  { name: 'building_well', file: 'building_well_blue', folder: 'buildings/blue' },
  { name: 'building_archeryrange', file: 'building_archeryrange_blue', folder: 'buildings/blue' },
];

const NATURE = [
  { name: 'tree_single_A', file: 'tree_single_A', folder: 'decoration/nature' },
  { name: 'tree_single_B', file: 'tree_single_B', folder: 'decoration/nature' },
  { name: 'trees_A_large', file: 'trees_A_large', folder: 'decoration/nature' },
  { name: 'trees_B_large', file: 'trees_B_large', folder: 'decoration/nature' },
  { name: 'rock_single_A', file: 'rock_single_A', folder: 'decoration/nature' },
  { name: 'rock_single_B', file: 'rock_single_B', folder: 'decoration/nature' },
];

const TARGET_DIR = path.resolve('public/assets/models');
const TEXTURE_DIR = path.resolve('public/assets/textures');
const TEMP_DIR = path.resolve('tmp_assets');

if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });
if (!fs.existsSync(TEXTURE_DIR)) fs.mkdirSync(TEXTURE_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function downloadFile(url, dest) {
  execSync(`curl -s -L -o "${dest}" "${url}"`);
}

async function run() {
  // Download texture
  const textureDest = path.join(TEMP_DIR, 'hexagons_medieval.png');
  downloadFile(BASE_URL_TEXTURE, textureDest);
  fs.copyFileSync(textureDest, path.join(TEXTURE_DIR, 'hexagons_medieval.png'));

  const items = [...BUILDINGS, ...NATURE];
  for (const item of items) {
    const gltfUrl = `${BASE_URL_MEDIEVAL}/${item.folder}/${item.file}.gltf`;
    const binUrl = `${BASE_URL_MEDIEVAL}/${item.folder}/${item.file}.bin`;

    const gltfDest = path.join(TEMP_DIR, `${item.file}.gltf`);
    const binDest = path.join(TEMP_DIR, `${item.file}.bin`);
    const finalGlb = path.join(TARGET_DIR, `${item.name}.glb`);

    console.log(`Downloading ${item.name}...`);
    downloadFile(gltfUrl, gltfDest);
    downloadFile(binUrl, binDest);

    // Convert gltf to self-contained glb with embedded texture and bin
    console.log(`Converting ${item.name} to GLB...`);
    execSync(`npx gltf-pipeline -i "${gltfDest}" -o "${finalGlb}" -b`);

    // Clean up temporary gltf and bin
    if (fs.existsSync(gltfDest)) fs.unlinkSync(gltfDest);
    if (fs.existsSync(binDest)) fs.unlinkSync(binDest);
  }

  // Cleanup temp files
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log('All 3D assets downloaded and converted successfully!');
}

run().catch(console.error);
