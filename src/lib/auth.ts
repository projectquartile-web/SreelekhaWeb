/**
 * auth.ts
 * Session helpers using Web Crypto API (Edge-safe).
 */

const COOKIE_NAME = "sl_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function base64UrlEncode(data: Uint8Array | string): string {
  let binary = "";
  if (typeof data === "string") {
    binary = btoa(data);
  } else {
    binary = btoa(String.fromCharCode(...data));
  }
  return binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getSessionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionJWT(secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    admin: true,
    exp: Math.floor((Date.now() + SESSION_DURATION_MS) / 1000),
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getSessionKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${dataToSign}.${signatureB64}`;
}

export async function verifySessionJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);

    const key = await getSessionKey(secret);
    const encoder = new TextEncoder();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as unknown as BufferSource,
      encoder.encode(dataToSign)
    );

    if (!isValid) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      return false; // Expired
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  // Using a fixed salt for simplicity, as there's only one admin.
  // In a multi-user system, use a random salt per user.
  const salt = encoder.encode("sreelekha-admin-salt");
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

export function getCookieName() {
  return COOKIE_NAME;
}
