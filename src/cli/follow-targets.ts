import { getAuthenticatedClient } from "../twitter/client.js";

const targetsToFollow = [
  "ChatgptAIskill",
  "ctgptlb",
  "Naoki_GPT",
  "aratamedo",
  "horomojisan",
  "ai_lab_japan",
];

async function main() {
  const client = getAuthenticatedClient();
  const me = await client.v2.me();
  console.log(`@${me.data.username} からフォロー開始\n`);

  for (const username of targetsToFollow) {
    try {
      const user = await client.v2.userByUsername(username);
      if (!user.data) {
        console.log(`  ✗ @${username}: 見つからない`);
        continue;
      }
      await client.v2.follow(me.data.id, user.data.id);
      console.log(`  ✓ @${username} をフォロー`);
    } catch (e: any) {
      console.log(`  ✗ @${username}: ${e.message}`);
    }
  }
}

main().catch(console.error);
