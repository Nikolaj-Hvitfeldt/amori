import { describe, expect, it } from "@jest/globals";
import { FakeBackend } from "../mock/FakeBackend";
import { fixtureDates, fixtureMilestones, fixtureMoments } from "../fixtures";

function makeBackend(scenario: "default" | "empty" | "error" = "default") {
  let clock = Date.parse("2026-11-13T12:00:00.000Z");
  return new FakeBackend({
    seed: { moments: fixtureMoments, dates: fixtureDates, milestones: fixtureMilestones },
    scenario,
    resolvePhoto: (p) => p.replace("fixture:", "http://localhost:8082/assets/"),
    uploadedImageUrl: "http://localhost:8082/assets/placeholder.png",
    now: () => (clock += 1000),
  });
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("FakeBackend", () => {
  it("paginates lists like the API, newest first", async () => {
    const backend = makeBackend();
    const first = await (await backend.handle("/moments?limit=4&offset=0")).json();
    const second = await (await backend.handle("/moments?limit=4&offset=4")).json();
    const all = await (await backend.handle("/moments")).json();

    expect(first.total).toBe(fixtureMoments.length);
    expect(first.data).toHaveLength(4);
    expect(second.data).toHaveLength(fixtureMoments.length - 4);
    expect(all.data).toHaveLength(fixtureMoments.length);
    expect([...first.data, ...second.data].map((m: any) => m.id)).toEqual(all.data.map((m: any) => m.id));

    const dates = all.data.map((m: any) => m.story_date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("resolves fixture photos to loadable URLs", async () => {
    const backend = makeBackend();
    const { data } = await (await backend.handle("/dates")).json();
    const photos = data.flatMap((d: any) => d.photos ?? []);
    expect(photos.length).toBeGreaterThan(0);
    photos.forEach((p: string) => expect(p.startsWith("http://localhost:8082/")).toBe(true));
  });

  it("round-trips create, read, update and delete", async () => {
    const backend = makeBackend();

    const createRes = await backend.handle(
      "/milestones",
      json({ milestone_type: "custom", title: "Test milestone", date: "2026-11-01" })
    );
    expect(createRes.ok).toBe(true);
    const created = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.created_at).toBeTruthy();

    const read = await (await backend.handle(`/milestones/${created.id}`)).json();
    expect(read.title).toBe("Test milestone");

    const patchRes = await backend.handle(`/milestones/${created.id}`, {
      ...json({ title: "Renamed" }),
      method: "PATCH",
    });
    const patched = await patchRes.json();
    expect(patched.title).toBe("Renamed");
    expect(patched.milestone_type).toBe("custom");

    const list = await (await backend.handle("/milestones?limit=100&offset=0")).json();
    expect(list.total).toBe(fixtureMilestones.length + 1);

    const delRes = await backend.handle(`/milestones/${created.id}`, { method: "DELETE" });
    expect(delRes.ok).toBe(true);
    const missing = await backend.handle(`/milestones/${created.id}`);
    expect(missing.ok).toBe(false);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("not found");
  });

  it("returns a distinct placeholder URL for each upload", async () => {
    const backend = makeBackend();
    const body = json({ image: "data:image/png;base64,iVBORw0KGgo=" });
    const a = await (await backend.handle("/moments/upload-image", body)).json();
    const b = await (await backend.handle("/dates/upload-image", body)).json();
    expect(a.url.startsWith("http://localhost:8082/assets/placeholder.png")).toBe(true);
    expect(a.url).not.toBe(b.url);
  });

  it("advances /sync/last-updated only for the resource that changed", async () => {
    const backend = makeBackend();
    const before = await (await backend.handle("/sync/last-updated")).json();
    await backend.handle("/dates", json({ date: "2026-11-02", location: "Here", description: "x", mood: "cozy" }));
    const after = await (await backend.handle("/sync/last-updated")).json();

    expect(Date.parse(after.dates)).toBeGreaterThan(Date.parse(before.dates));
    expect(after.moments).toBe(before.moments);
    expect(after.milestones).toBe(before.milestones);
  });

  it("serves the empty and error scenarios", async () => {
    const empty = await (await makeBackend("empty").handle("/moments?limit=10&offset=0")).json();
    expect(empty).toEqual({ data: [], total: 0 });

    const error = await makeBackend("error").handle("/moments?limit=10&offset=0");
    expect(error.ok).toBe(false);
    expect(error.status).toBe(500);
  });
});
