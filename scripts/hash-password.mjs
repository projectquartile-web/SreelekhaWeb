import crypto from "crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node hash-password.mjs <password>");
  process.exit(1);
}

// Emulate the Web Crypto API PBKDF2 used in Cloudflare Workers
const salt = Buffer.from("sreelekha-admin-salt");

crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, derivedKey) => {
  if (err) throw err;
  const hashHex = derivedKey.toString("hex");
  console.log("----------------------------------------");
  console.log("Password Hash for Cloudflare Secrets:");
  console.log("----------------------------------------");
  console.log(hashHex);
  console.log("----------------------------------------");
  console.log("Save this value as ADMIN_PASSWORD_HASH in Cloudflare Secrets");
});
