# X LEGENDS – Optional realistic medieval assets

The project keeps its original KayKit models as offline-safe fallbacks. To add the higher-detail medieval models, run this from the project root on a computer with internet access:

```bash
node scripts/download_realistic_assets.mjs
```

The script downloads three GLB files into `public/assets/models/realistic/`:

| Model | Source asset | Approx. triangles | Use |
|---|---|---:|---|
| `smithy.glb` | [Village Smithy – Blacksmith Forge and Armoury](https://3dassets.dev/assets/blacksmith-forge-and-armoury-blacksmith--bb9e9c8a-starter-scene) | 42,072 | Replaces the low-poly blacksmith when present |
| `cloister.glb` | [Cloister Garth and Outer Court](https://3dassets.dev/assets/medieval-monastery-and-scriptorium-clois-3b7f713a-starter-scene) | 195,904 | Replaces the low-poly church when present |
| `bell_tower.glb` | [Bell Tower Section](https://3dassets.dev/assets/medieval-monastery-and-scriptorium-bell-tower-section-48ca871a) | 16,600 | Adds a stone tower landmark |

All three source pages state CC0 1.0: commercial use and modification are allowed, with no attribution required. The models are optional; if a download is missing, the game continues using its original local building model. The cloister is the heaviest asset, so test performance on the target Android phone before expanding the town with more high-detail models.

Sources and licence: https://creativecommons.org/publicdomain/zero/1.0/
