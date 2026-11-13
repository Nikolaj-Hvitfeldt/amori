/**
 * Bundled placeholder photos for the fixtures (generated, not real photos).
 * Only loaded through a __DEV__-guarded require from src/mock.
 */
import type { FixturePhotoName } from "./index";

/** What require("x.png") returns: an asset id on native, { uri, width, height } on web. */
export type FixtureAssetModule = number | { uri: string; width: number; height: number };

export const fixturePhotoModules: Record<FixturePhotoName, FixtureAssetModule> = {
  "photo-1": require("../../assets/fixtures/photo-1.png"),
  "photo-2": require("../../assets/fixtures/photo-2.png"),
  "photo-3": require("../../assets/fixtures/photo-3.png"),
  "photo-4": require("../../assets/fixtures/photo-4.png"),
  "photo-5": require("../../assets/fixtures/photo-5.png"),
  "photo-6": require("../../assets/fixtures/photo-6.png"),
  placeholder: require("../../assets/fixtures/placeholder.png"),
};
