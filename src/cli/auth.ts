import { getAuthenticatedClient } from "../twitter/client.js";

async function main() {
  console.log("🔐 X API 認証テスト...\n");

  const client = getAuthenticatedClient();
  const me = await client.v2.me();

  console.log(`✓ 認証成功: @${me.data.username}`);
  console.log(`  ID: ${me.data.id}`);
}

main().catch((err) => {
  console.error("認証エラー:", err.message ?? err);
  if (err.data) console.error("詳細:", JSON.stringify(err.data, null, 2));
  process.exit(1);
});
