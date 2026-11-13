/**
 * Builds the FakeBackend for mock mode from the fixtures.
 * Only ever loaded through the __DEV__-guarded require in services/api.ts.
 */
import { Asset } from "expo-asset";
import { FakeBackend } from "./FakeBackend";
import { getMockScenario } from "./mode";
import {
  FIXTURE_PHOTO_PREFIX,
  FixturePhotoName,
  fixtureDates,
  fixtureMilestones,
  fixtureMoments,
} from "../fixtures";
import { fixturePhotoModules } from "../fixtures/assets";

/**
 * Turns a bundled asset into an absolute dev-server URL.
 *
 * The screens only show photos whose URL starts with http(s) (filterValidPhotos
 * and friends). Metro serves bundled assets from the dev server, which is
 * http://localhost:<port> on web, so resolving to that URL lets the fixture
 * photos pass those filters without touching real-mode code. expo-asset returns
 * a path relative to the page on web, so prefix the page origin.
 */
function assetUrl(name: FixturePhotoName): string {
  const uri = Asset.fromModule(fixturePhotoModules[name]).uri;
  const origin: unknown = (globalThis as any).window?.location?.origin;
  if (uri.startsWith("/") && typeof origin === "string") return `${origin}${uri}`;
  return uri;
}

function resolvePhoto(photo: string): string {
  if (!photo.startsWith(FIXTURE_PHOTO_PREFIX)) return photo;
  const name = photo.slice(FIXTURE_PHOTO_PREFIX.length) as FixturePhotoName;
  return name in fixturePhotoModules ? assetUrl(name) : photo;
}

export function createMockBackend(): FakeBackend {
  return new FakeBackend({
    seed: { moments: fixtureMoments, dates: fixtureDates, milestones: fixtureMilestones },
    scenario: getMockScenario(),
    resolvePhoto,
    uploadedImageUrl: assetUrl("placeholder"),
  });
}
