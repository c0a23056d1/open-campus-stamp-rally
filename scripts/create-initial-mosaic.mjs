import crypto from "crypto";
import { PrivateKey } from "symbol-sdk";
import {
  SymbolFacade,
  KeyPair,
  generateMosaicId,
} from "symbol-sdk/symbol";

const NODE_URL =
  process.env.SYMBOL_NODE_URL || "https://testnet1.symbol-mikun.net:3001";
const NETWORK = process.env.SYMBOL_NETWORK || "testnet";
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;

if (!OPERATOR_PRIVATE_KEY) {
  throw new Error("OPERATOR_PRIVATE_KEY が .env に設定されていません");
}

const facade = new SymbolFacade(NETWORK);
const keyPair = new KeyPair(new PrivateKey(OPERATOR_PRIVATE_KEY));

async function getNetworkTime() {
  const res = await fetch(`${NODE_URL}/node/time`);
  if (!res.ok) throw new Error("ネットワーク時刻取得失敗");
  const data = await res.json();

  const raw =
    data.communicationTimestamps?.receiveTimestamp ??
    data.communicationTimestamps?.sendTimestamp;

  return BigInt(raw);
}

async function getFeeMultiplier() {
  const res = await fetch(`${NODE_URL}/network/fees/transaction`);
  if (!res.ok) throw new Error("手数料係数取得失敗");
  const data = await res.json();

  return BigInt(data.medianFeeMultiplier ?? 100);
}

async function announceTransaction(payload) {
  const res = await fetch(`${NODE_URL}/transactions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`トランザクション送信失敗: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  const timestamp = await getNetworkTime();
  const feeMultiplier = await getFeeMultiplier();

  // 4バイトのnonceを自前で生成
  const nonceBytes = crypto.randomBytes(4);
  const nonce = nonceBytes.readUInt32LE(0);

  // 運営ウォレットの公開鍵からSymbolアドレスを作成
  const operatorAddress = facade.network.publicKeyToAddress(keyPair.publicKey);

  // nonce + 運営アドレスからMosaic IDを生成
  const mosaicId = generateMosaicId(operatorAddress, nonceBytes);

  console.log("operatorAddress:", operatorAddress.toString());
  console.log("nonce:", nonce);
  console.log("nonce(hex):", nonceBytes.toString("hex"));
  console.log("mosaicId:", mosaicId.toString());

  const deadline = timestamp + 2n * 60n * 60n * 1000n;

  const mosaicDefinitionTx = facade.transactionFactory.create({
    type: "mosaic_definition_transaction_v1",
    signerPublicKey: keyPair.publicKey.toString(),
    deadline,
    duration: 0n,
    nonce: nonce,
    id: mosaicId,
    flags: {
      supplyMutable: true,
      transferable: true,
      restrictable: false,
      revokable: false,
    },
    divisibility: 0,
  });

  // mosaicDefinitionTx.fee = feeMultiplier * BigInt(mosaicDefinitionTx.size);
  mosaicDefinitionTx.fee = 1000000n;

  const mosaicSupplyTx = facade.transactionFactory.create({
    type: "mosaic_supply_change_transaction_v1",
    signerPublicKey: keyPair.publicKey.toString(),
    deadline,
    mosaicId,
    delta: 1000n,
    action: "increase",
  });

  // mosaicSupplyTx.fee = feeMultiplier * BigInt(mosaicSupplyTx.size);
  mosaicSupplyTx.fee = 1000000n;

  const txs = [mosaicDefinitionTx, mosaicSupplyTx];

  for (const tx of txs) {
    const signature = facade.signTransaction(keyPair, tx);
    const payload = facade.transactionFactory.static.attachSignature(
      tx,
      signature
    );
    const txHash = facade.hashTransaction(tx).toString();

    console.log("Announcing tx...");
    console.log("hash:", txHash);

    const result = await announceTransaction(payload);
    console.log("announce result:", result);
  }

  console.log("=== Mosaic Created ===");
  console.log("mosaicId:", mosaicId.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});