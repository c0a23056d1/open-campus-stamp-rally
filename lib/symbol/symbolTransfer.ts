import { PrivateKey } from "symbol-sdk";
import { KeyPair, SymbolFacade } from "symbol-sdk/symbol";

type SendMosaicParams = {
  recipientAddress: string;
  mosaicId: string;
  amount: number;
};

const NODE_URL =
  process.env.SYMBOL_NODE_URL || "https://testnet1.symbol-mikun.net:3001";
const NETWORK = process.env.SYMBOL_NETWORK || "testnet";

async function getNetworkTime() {
  const res = await fetch(`${NODE_URL}/node/time`);
  if (!res.ok) throw new Error("ネットワーク時刻取得に失敗しました");

  const data = await res.json();
  const raw =
    data.communicationTimestamps?.receiveTimestamp ??
    data.communicationTimestamps?.sendTimestamp;

  return BigInt(raw);
}

async function announceTransaction(payload: string) {
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

export async function sendInitialMosaic({
  recipientAddress,
  mosaicId,
  amount,
}: SendMosaicParams) {
  const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;

  if (!operatorPrivateKey) {
    throw new Error("OPERATOR_PRIVATE_KEY が設定されていません");
  }

  const facade = new SymbolFacade(NETWORK);
  const keyPair = new KeyPair(new PrivateKey(operatorPrivateKey));

  const timestamp = await getNetworkTime();
  const deadline = timestamp + 2n * 60n * 60n * 1000n;

  const transferTx = facade.transactionFactory.create({
    type: "transfer_transaction_v1",
    signerPublicKey: keyPair.publicKey.toString(),
    fee: 1000000n,
    deadline,
    recipientAddress,
    mosaics: [
      {
        mosaicId: BigInt(`0x${mosaicId}`),
        amount: BigInt(amount),
      },
    ],
  });

  const signature = facade.signTransaction(keyPair, transferTx);

  const payload = facade.transactionFactory.static.attachSignature(
    transferTx,
    signature
  );

  const txHash = facade.hashTransaction(transferTx).toString();

  const result = await announceTransaction(payload);

  return {
    txHash,
    result,
  };
}