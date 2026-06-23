import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getSecretKey() {
  const secretKey = process.env.WALLET_SECRET_KEY;

  if (!secretKey) {
    throw new Error("WALLET_SECRET_KEY が設定されていません");
  }

  if (secretKey.length !== 32) {
    throw new Error("WALLET_SECRET_KEY は32文字で設定してください");
  }

  return Buffer.from(secretKey);
}

export function encryptText(text: string) {
  const key = getSecretKey();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptText(encryptedText: string) {
  const key = getSecretKey();

  const [ivHex, encrypted] = encryptedText.split(":");

  if (!ivHex || !encrypted) {
    throw new Error("暗号化データの形式が不正です");
  }

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}