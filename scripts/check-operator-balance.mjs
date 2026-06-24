const NODE_URL =
  process.env.SYMBOL_NODE_URL || "https://testnet1.symbol-mikun.net:3001";

const ADDRESS = process.env.OPERATOR_ADDRESS; 

if (!ADDRESS) {
  throw new Error("OPERATOR_ADDRESS が .env に設定されていません");
}

async function main() {
  const res = await fetch(`${NODE_URL}/accounts/${ADDRESS}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`アカウント情報取得失敗: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});