import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const ASSET_MANIFEST: Record<string, string> = {
  // Player
  knight: assetPath('assets/models/Knight.glb'),

  // Town Buildings
  building_blacksmith: assetPath('assets/models/building_blacksmith.glb'),
  building_tavern: assetPath('assets/models/building_tavern.glb'),
  building_church: assetPath('assets/models/building_church.glb'),
  building_market: assetPath('assets/models/building_market.glb'),
  building_home_A: assetPath('assets/models/building_home_A.glb'),
  building_home_B: assetPath('assets/models/building_home_B.glb'),
  building_castle: assetPath('assets/models/building_castle.glb'),
  building_well: assetPath('assets/models/building_well.glb'),
  building_archeryrange: assetPath('assets/models/building_archeryrange.glb'),

  // Higher-detail medieval environment models
  realistic_smithy: assetPath('assets/models/realistic/smithy.glb'),
  realistic_cloister: assetPath('assets/models/realistic/cloister.glb'),
  realistic_bell_tower: assetPath('assets/models/realistic/bell_tower.glb'),

  // Nature Scenery
  tree_single_A: assetPath('assets/models/tree_single_A.glb'),
  tree_single_B: assetPath('assets/models/tree_single_B.glb'),
  trees_A_large: assetPath('assets/models/trees_A_large.glb'),
  trees_B_large: assetPath('assets/models/trees_B_large.glb'),
  rock_single_A: assetPath('assets/models/rock_single_A.glb'),
  rock_single_B: assetPath('assets/models/rock_single_B.glb'),

  // Monsters & Creatures
  skeleton_warrior: assetPath('assets/models/Skeleton_Warrior.glb'),
  skeleton_golem: assetPath('assets/models/Skeleton_Golem.glb'),
  skeleton_rogue: assetPath('assets/models/Skeleton_Rogue.glb'),
  skeleton_mage: assetPath('assets/models/Skeleton_Mage.glb'),
  fox: assetPath('assets/models/Fox.glb'),
  horse: assetPath('assets/models/Horse.glb'),
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

  public getGLTF(key: string): GLTF | undefined {
    return this.cache.get(key);
  }

  public cloneModel(key: string): THREE.Group | null {
    const gltf = this.cache.get(key);
    if (!gltf) {
      console.warn(`[AssetManager] Cannot clone missing asset key: '${key}'`);
      return null;
    }
    const cloned = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }

  public getAnimations(key: string): THREE.AnimationClip[] {
    const gltf = this.cache.get(key);
    return gltf ? gltf.animations : [];
  }
}
