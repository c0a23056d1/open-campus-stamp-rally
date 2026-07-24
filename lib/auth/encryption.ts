const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PBKDF2_ITERATIONS = 310_000;

export type EncryptedPrivateKey = {
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
};

/**
 * TypeScriptのUint8Array<ArrayBufferLike>を、
 * Web Crypto APIが確実に受け取れるArrayBufferへコピーする。
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function deriveEncryptionKey(
  pin: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const pinBytes = encoder.encode(pin);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(pinBytes),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export function validatePin(pin: string): void {
  if (!/^\d{6,12}$/.test(pin)) {
    throw new Error("PINは6桁以上12桁以下の数字で入力してください");
  }
}

export async function encryptPrivateKey(
  privateKey: string,
  pin: string
): Promise<EncryptedPrivateKey> {
  validatePin(pin);

  if (!privateKey) {
    throw new Error("秘密鍵が指定されていません");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptionKey = await deriveEncryptionKey(pin, salt);
  const privateKeyBytes = encoder.encode(privateKey);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv),
    },
    encryptionKey,
    toArrayBuffer(privateKeyBytes)
  );

  return {
    encryptedPrivateKey: bytesToBase64(new Uint8Array(encrypted)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
  };
}

export async function decryptPrivateKey(
  encryptedData: EncryptedPrivateKey,
  pin: string
): Promise<string> {
  validatePin(pin);

  try {
    const salt = base64ToBytes(encryptedData.salt);
    const iv = base64ToBytes(encryptedData.iv);
    const encryptedPrivateKey = base64ToBytes(
      encryptedData.encryptedPrivateKey
    );

    const encryptionKey = await deriveEncryptionKey(pin, salt);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
      },
      encryptionKey,
      toArrayBuffer(encryptedPrivateKey)
    );

    return decoder.decode(decrypted);
  } catch {
    throw new Error("PINが正しくないか、ウォレット情報が壊れています");
  }
}