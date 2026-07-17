import { PrivateKey } from "symbol-sdk";
import { KeyPair, SymbolFacade } from "symbol-sdk/symbol";


export function createSymbolWallet() {
  const facade = new SymbolFacade("testnet");

  const privateKey = PrivateKey.random();
  const keyPair = new KeyPair(privateKey);

  const publicKey = keyPair.publicKey.toString();
  const address = facade.network.publicKeyToAddress(keyPair.publicKey).toString();

  return {
    symbolAddress: address,
    symbolPublicKey: publicKey,
    encryptedPrivateKey: privateKey.toString(),
  };
}