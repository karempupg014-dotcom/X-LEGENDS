import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export const ASSET_MANIFEST: Record<string, string> = {
  // Player
  knight: '/assets/models/Knight.glb',

  // Town Buildings
  building_blacksmith: '/assets/models/building_blacksmith.glb',
  building_tavern: '/assets/models/building_tavern.glb',
  building_church: '/assets/models/building_church.glb',
  building_market: '/assets/models/building_market.glb',
  building_home_A: '/assets/models/building_home_A.glb',
  building_home_B: '/assets/models/building_home_B.glb',
  building_castle: '/assets/models/building_castle.glb',
  building_well: '/assets/models/building_well.glb',
  building_archeryrange: '/assets/models/building_archeryrange.glb',

  // Higher-detail medieval environment models (download with scripts/download_realistic_assets.mjs)
  realistic_smithy: '/assets/models/realistic/smithy.glb',
  realistic_cloister: '/assets/models/realistic/cloister.glb',
  realistic_bell_tower: '/assets/models/realistic/bell_tower.glb',

  // Nature Scenery
  tree_single_A: '/assets/models/tree_single_A.glb',
  tree_single_B: '/assets/models/tree_single_B.glb',
  trees_A_large: '/assets/models/trees_A_large.glb',
  trees_B_large: '/assets/models/trees_B_large.glb',
  rock_single_A: '/assets/models/rock_single_A.glb',
  rock_single_B: '/assets/models/rock_single_B.glb',

  // Monsters & Creatures
  skeleton_warrior: '/assets/models/Skeleton_Warrior.glb',
  skeleton_golem: '/assets/models/Skeleton_Golem.glb',
  skeleton_rogue: '/assets/models/Skeleton_Rogue.glb',
  skeleton_mage: '/assets/models/Skeleton_Mage.glb',
  fox: '/assets/models/Fox.glb',
  horse: '/assets/models/Horse.glb',
};

export class AssetManager {
  private static instance: AssetManager;
  private loader: GLTFLoader;
  private cache: Map<string, GLTF> = new Map();
  public isLoaded: boolean = false;
  public loadErrors: string[] = [];

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Asynchronously loads all 3D GLB assets in ASSET_MANIFEST
   */
  public async loadAll(
    onProgress?: (percent: number, currentAsset: string) => void
  ): Promise<void> {
    if (this.isLoaded) {
      onProgress?.(100, 'Complete');
      return;
    }

    const entries = Object.entries(ASSET_MANIFEST);
    const total = entries.length;
    let completed = 0;

    for (const [key, path] of entries) {
      onProgress?.(Math.round((completed / total) * 100), key);
      try {
        const gltf = await this.loadSingleGLTF(key, path);
        this.cache.set(key, gltf);
        console.log(`[AssetManager] Loaded 3D GLB asset: '${key}' from '${path}' (${gltf.animations.length} animations)`);
      } catch (err) {
        const errMsg = `Failed to load GLB model '${key}' at path '${path}': ${err}`;
        console.error(`[AssetManager] ${errMsg}`);
        this.loadErrors.push(errMsg);
      }
      completed++;
      onProgress?.(Math.round((completed / total) * 100), key);
    }

    this.isLoaded = true;
    onProgress?.(100, 'Complete');
  }

  private loadSingleGLTF(key: string, path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          // Enable shadow casting/receiving on all loaded child meshes
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          resolve(gltf);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Retrieves raw loaded GLTF
   */
  public getGLTF(key: string): GLTF | undefined {
    return this.cache.get(key);
  }

  /**
   * Clones a 3D model properly preserving skinned mesh bone structures and materials
   */
  public cloneModel(key: string): THREE.Group | null {
    const gltf = this.cache.get(key);
    if (!gltf) {
      console.warn(`[AssetManager] Cannot clone missing asset key: '${key}'`);
      return null;
    }
    // SkeletonUtils.clone is required for GLTF SkinnedMeshes with bones!
    const cloned = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }

  /**
   * Retrieves animation clips for a loaded key
   */
  public getAnimations(key: string): THREE.AnimationClip[] {
    const gltf = this.cache.get(key);
    return gltf ? gltf.animations : [];
  }
}
