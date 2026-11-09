import * as SecureStore from "expo-secure-store";
import { demoRequest, resetDemo } from "./demo";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TOKEN_KEY = "agrointel.token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// The token lives in the device keychain; it's cached in memory after the first read.
let token: string | null = null;

export const tokenStore = {
  load: async () => (token = await SecureStore.getItemAsync(TOKEN_KEY)),
  set: async (value: string | null) => {
    token = value;
    if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// Demo mode answers every request from sample data on the device — no server needed.
let demo = false;
export const demoMode = {
  isOn: () => demo,
  set: (on: boolean) => {
    demo = on;
    if (on) resetDemo();
  },
};

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  if (demo) {
    try {
      return await demoRequest<T>(path, rest.method ?? "GET", json, rest.body);
    } catch (e) {
      throw new ApiError(400, (e as Error).message);
    }
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(json !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, "Can't reach AgroIntel. Check your internet connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong");
  return body as T;
}

/** A local photo in the shape React Native's FormData expects for file uploads. */
export function photoPart(uri: string, mimeType = "image/jpeg") {
  const ext = mimeType.split("/")[1] ?? "jpg";
  return { uri, type: mimeType, name: `plant.${ext}` } as unknown as Blob;
}
