import crypto from "crypto";
import { PrivateKey } from "symbol-sdk";
import { SymbolFacade, KeyPair, generateMosaicId } from "symbol-sdk/symbol";

const NETWORK = process.env.SYMBOL_NETWORK || "testnet";
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;

if (!OPERATOR_PRIVATE_KEY) {
  throw new Error("OPERATOR_PRIVATE_KEY が .env に設定されていません");
}

const facade = new SymbolFacade(NETWORK);
const keyPair = new KeyPair(new PrivateKey(OPERATOR_PRIVATE_KEY));

// 4バイトのnonceを自前生成
const nonce = crypto.randomBytes(4);

// Symbolアドレスを取得
const address = facade.network.publicKeyToAddress(keyPair.publicKey);

// mosaicIdを生成
const mosaicId = generateMosaicId(address, nonce);

console.log("address:", address.toString());
console.log("nonce(hex):", nonce.toString("hex"));
console.log("mosaicId:", mosaicId.toString());