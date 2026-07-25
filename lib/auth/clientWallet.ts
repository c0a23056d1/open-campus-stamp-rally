import { PrivateKey } from "symbol-sdk";
import { KeyPair, SymbolFacade } from "symbol-sdk/symbol";

const NETWORK = "testnet";
const textEncoder = new TextEncoder();

export type GeneratedClientWallet = {
  privateKey: string;
  symbolPublicKey: string;
  symbolAddress: string;
};

/**
 * 利用者のブラウザ内で新しいSymbolウォレットを生成する。
 *
 * この関数が返すprivateKeyは、APIやログへ送信しないこと。
 */
export function generateClientSymbolWallet(): GeneratedClientWallet {
  const facade = new SymbolFacade(NETWORK);

  const privateKey = PrivateKey.random();
  const keyPair = new KeyPair(privateKey);

  return {
    privateKey: privateKey.toString(),
    symbolPublicKey: keyPair.publicKey.toString(),
    symbolAddress: facade.network
      .publicKeyToAddress(keyPair.publicKey)
      .toString(),
  };
}

/**
 * サーバーから返された認証メッセージへ署名する。
 */
export function signAuthenticationMessage(
  privateKeyHex: string,
  message: string
): string {
  if (!privateKeyHex) {
    throw new Error("秘密鍵が指定されていません");
  }

  if (!message) {
    throw new Error("署名対象のメッセージが指定されていません");
  }

  const privateKey = new PrivateKey(privateKeyHex);
  const keyPair = new KeyPair(privateKey);
  const messageBytes = textEncoder.encode(message);

  const signature = keyPair.sign(messageBytes);

  return signature.toString();
}