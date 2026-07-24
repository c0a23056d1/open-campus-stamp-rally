import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { EncryptedPrivateKey } from "@/lib/auth/encryption";

const DATABASE_NAME = "oc-passport-wallet";
const DATABASE_VERSION = 1;
const STORE_NAME = "wallet";
const PRIMARY_WALLET_KEY = "primary-wallet";

export type StoredSymbolWallet = EncryptedPrivateKey & {
  symbolAddress: string;
  symbolPublicKey: string;
  createdAt: string;
};

interface OcPassportWalletDatabase extends DBSchema {
  wallet: {
    key: string;
    value: StoredSymbolWallet;
  };
}

async function getDatabase(): Promise<
  IDBPDatabase<OcPassportWalletDatabase>
> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDBはブラウザ上でのみ利用できます");
  }

  return openDB<OcPassportWalletDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      },
    }
  );
}

export async function saveWallet(
  wallet: StoredSymbolWallet
): Promise<void> {
  const database = await getDatabase();

  await database.put(
    STORE_NAME,
    wallet,
    PRIMARY_WALLET_KEY
  );
}

export async function loadWallet(): Promise<StoredSymbolWallet | null> {
  const database = await getDatabase();

  const wallet = await database.get(
    STORE_NAME,
    PRIMARY_WALLET_KEY
  );

  return wallet ?? null;
}

export async function hasWallet(): Promise<boolean> {
  const wallet = await loadWallet();

  return wallet !== null;
}

export async function deleteWallet(): Promise<void> {
  const database = await getDatabase();

  await database.delete(
    STORE_NAME,
    PRIMARY_WALLET_KEY
  );
}

export async function clearWalletDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.clear(STORE_NAME);
}