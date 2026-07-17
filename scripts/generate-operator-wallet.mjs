import { PrivateKey } from "symbol-sdk";
import { SymbolFacade } from "symbol-sdk/symbol";

const facade = new SymbolFacade("testnet");

const privateKey = PrivateKey.random();
const keyPair = new facade.constructor.KeyPair(privateKey);

const publicKey = keyPair.publicKey.toString();
const address = facade.network.publicKeyToAddress(keyPair.publicKey).toString();

console.log("=== Operator Wallet ===");
console.log("address:", address);
console.log("publicKey:", publicKey);
console.log("privateKey:", privateKey.toString());