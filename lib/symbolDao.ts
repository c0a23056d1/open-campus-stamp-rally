import { PrivateKey } from "symbol-sdk";
import { KeyPair, SymbolFacade } from "symbol-sdk/symbol";

const NODE_URL = process.env.SYMBOL_NODE_URL || "https://testnet1.symbol-mikun.net:3001";
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
        throw new Error(`DAOイベント送信失敗：${res.status} ${text}`);
    }

    return res.json();
}

type SendDaoEventParams = {
    eventType: string;
    proposalId: number;
    title: string;
    status: string;
    actorUserId: number;
};

export async function sendDaoEvent({
    eventType,
    proposalId,
    title,
    status,
    actorUserId,
}: SendDaoEventParams) {
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;

    if (!operatorPrivateKey) {
        throw new Error("OPERATOR_PRIVATE_KEYが設定されていません");
    }

    const facade = new SymbolFacade(NETWORK);
    const keyPair = new KeyPair(new PrivateKey(operatorPrivateKey));

    const timestamp = await getNetworkTime();
    const deadline = timestamp + 2n * 60n * 60n * 1000n;

    const eventPayload = {
        system: "OC_PASSPORT_DAO",
        eventType,
        proposalId,
        title,
        status,
        actorUserId,
        recordeAt: new Date().toISOString(),
    };
    const messageText = `OC_DAO_EVENT:${JSON.stringify(eventPayload)}`;

    const operatorAddress = facade.network.publicKeyToAddress(keyPair.publicKey);

    const transferTx = facade.transactionFactory.create({
        type: "transfer_transaction_v1",
        signerPublicKey: keyPair.publicKey.toString(),
        fee: 2000000n,
        deadline,
        recipientAddress: operatorAddress,
        mosaics: [],
        message: new TextEncoder().encode(messageText),
    });

    const signature = facade.signTransaction(keyPair, transferTx);

    const payload = facade.transactionFactory.static.attachSignature(
        transferTx,
        signature
    );

    const txHash = facade.hashTransaction(transferTx).toString();

    await announceTransaction(payload);

    return { txHash };
}

