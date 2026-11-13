/**
 * In-memory stand-in for the NestJS API, used only in mock mode.
 *
 * It mirrors the real routes the services call:
 *   GET    /{moments|dates|milestones}?limit=&offset=  -> { data, total }
 *   GET    /{resource}/:id                             -> entry | 404
 *   POST   /{resource}                                 -> created entry
 *   PATCH  /{resource}/:id                             -> updated entry | 404
 *   DELETE /{resource}/:id                             -> { message } | 404
 *   POST   /{resource}/upload-image                    -> { url, thumbnailUrl }
 *   GET    /sync/last-updated                          -> { moments, dates, milestones }
 *
 * Lists are sorted newest first by the same column as the backend
 * (moments: story_date, dates and milestones: date). Pagination follows
 * backend/src/utils/supabase-helpers.ts.
 */
import type { Moment } from "../types/moments";
import type { DateEntry } from "../types/dates";
import type { Milestone } from "../types/milestones";
import type { MockScenario } from "./mode";

export type ResourceName = "moments" | "dates" | "milestones";

/** The subset of the fetch Response the services use. */
export interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<any>;
  text(): Promise<string>;
}

export interface MockRequestInit {
  method?: string;
  body?: unknown;
  headers?: unknown;
}

export interface FakeBackendSeed {
  moments: Moment[];
  dates: DateEntry[];
  milestones: Milestone[];
}

export interface FakeBackendOptions {
  seed: FakeBackendSeed;
  scenario?: MockScenario;
  /** Maps fixture photo references to loadable URLs. Defaults to identity. */
  resolvePhoto?: (photo: string) => string;
  /** URL returned by upload-image. */
  uploadedImageUrl?: string;
  /** Clock, injectable for tests. */
  now?: () => number;
}

const DEFAULT_LIMIT = 10; // backend PAGINATION_DEFAULTS.DEFAULT_LIMIT

const SORT_FIELD: Record<ResourceName, string> = {
  moments: "story_date",
  dates: "date",
  milestones: "date",
};

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  404: "Not Found",
  500: "Internal Server Error",
};

export function createMockResponse(status: number, body: unknown): MockResponse {
  const text = body === undefined ? "" : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: STATUS_TEXT[status] ?? "",
    json: async () => JSON.parse(text),
    text: async () => text,
  };
}

type Entry = { id?: string; created_at?: string; updated_at?: string; photos?: string[]; [key: string]: unknown };

export class FakeBackend {
  private tables: Record<ResourceName, Entry[]>;
  private lastUpdated: Record<ResourceName, number>;
  private scenario: MockScenario;
  private now: () => number;
  private uploadedImageUrl: string;
  private nextId = 1;
  private nextUpload = 1;

  constructor(options: FakeBackendOptions) {
    this.scenario = options.scenario ?? "default";
    this.now = options.now ?? (() => Date.now());
    const resolvePhoto = options.resolvePhoto ?? ((p: string) => p);
    this.uploadedImageUrl = options.uploadedImageUrl ?? "";

    const load = (rows: Entry[]): Entry[] =>
      this.scenario === "empty"
        ? []
        : rows.map((row) => ({
            ...row,
            ...(row.photos ? { photos: row.photos.map(resolvePhoto) } : {}),
          }));

    this.tables = {
      moments: load(options.seed.moments as unknown as Entry[]),
      dates: load(options.seed.dates as unknown as Entry[]),
      milestones: load(options.seed.milestones as unknown as Entry[]),
    };

    const start = this.now();
    this.lastUpdated = { moments: start, dates: start, milestones: start };
  }

  async handle(path: string, init?: MockRequestInit): Promise<MockResponse> {
    const method = (init?.method ?? "GET").toUpperCase();
    const [pathname, query = ""] = path.split("?");
    const segments = pathname.split("/").filter(Boolean);
    const params = parseQuery(query);

    if (this.scenario === "error") {
      return createMockResponse(500, { statusCode: 500, message: "Mock scenario: error" });
    }

    if (segments[0] === "sync" && segments[1] === "last-updated" && method === "GET") {
      return createMockResponse(200, {
        moments: this.timestamp("moments"),
        dates: this.timestamp("dates"),
        milestones: this.timestamp("milestones"),
      });
    }

    const resource = segments[0] as ResourceName;
    if (!(resource in this.tables) || segments.length > 2) {
      return notFound(`Cannot ${method} ${pathname}`);
    }
    const id = segments[1];

    if (id === "upload-image" && method === "POST") {
      const body = parseBody(init?.body);
      if (!body || typeof body.image !== "string" || !body.image.startsWith("data:")) {
        return createMockResponse(400, { statusCode: 400, message: "Invalid image data" });
      }
      // A distinct URL per upload, so two uploads never collide as list keys.
      const separator = this.uploadedImageUrl.includes("?") ? "&" : "?";
      const url = `${this.uploadedImageUrl}${separator}mockUpload=${this.nextUpload++}`;
      return createMockResponse(201, { url, thumbnailUrl: url });
    }

    if (!id) {
      if (method === "GET") return createMockResponse(200, this.list(resource, params));
      if (method === "POST") return createMockResponse(201, this.create(resource, parseBody(init?.body)));
      return notFound(`Cannot ${method} ${pathname}`);
    }

    const index = this.tables[resource].findIndex((row) => row.id === id);
    if (index === -1) return notFound(`Entry with ID ${id} not found`);

    if (method === "GET") return createMockResponse(200, this.tables[resource][index]);
    if (method === "PATCH") {
      const updated: Entry = {
        ...this.tables[resource][index],
        ...(parseBody(init?.body) ?? {}),
        id,
        updated_at: this.touch(resource),
      };
      this.tables[resource][index] = updated;
      return createMockResponse(200, updated);
    }
    if (method === "DELETE") {
      this.tables[resource].splice(index, 1);
      this.touch(resource);
      return createMockResponse(200, { message: "Deleted successfully" });
    }
    return notFound(`Cannot ${method} ${pathname}`);
  }

  private list(resource: ResourceName, params: Record<string, string>) {
    const field = SORT_FIELD[resource];
    const sorted = [...this.tables[resource]].sort((a, b) =>
      String(b[field] ?? "").localeCompare(String(a[field] ?? ""))
    );
    const limit = params.limit !== undefined ? parseInt(params.limit, 10) : undefined;
    const offset = params.offset !== undefined ? parseInt(params.offset, 10) : undefined;

    let data = sorted;
    if (offset !== undefined) {
      data = sorted.slice(offset, offset + (limit || DEFAULT_LIMIT));
    } else if (limit !== undefined) {
      data = sorted.slice(0, limit);
    }
    return { data, total: sorted.length };
  }

  private create(resource: ResourceName, body: Record<string, unknown> | null): Entry {
    const timestamp = this.touch(resource);
    const entry: Entry = {
      ...(body ?? {}),
      id: `mock-${resource}-${this.nextId++}`,
      created_at: timestamp,
      updated_at: timestamp,
    };
    if (resource === "dates" && !Array.isArray(entry.highlights)) entry.highlights = [];
    this.tables[resource].push(entry);
    return entry;
  }

  /** Advances the resource's last-updated time and returns it as ISO text. */
  private touch(resource: ResourceName): string {
    this.lastUpdated[resource] = Math.max(this.now(), this.lastUpdated[resource] + 1);
    return new Date(this.lastUpdated[resource]).toISOString();
  }

  private timestamp(resource: ResourceName): string {
    return new Date(this.lastUpdated[resource]).toISOString();
  }
}

function notFound(message: string): MockResponse {
  return createMockResponse(404, { statusCode: 404, message });
}

function parseQuery(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const [key, value = ""] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return params;
}

function parseBody(body: unknown): Record<string, any> | null {
  if (typeof body !== "string" || body === "") return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
