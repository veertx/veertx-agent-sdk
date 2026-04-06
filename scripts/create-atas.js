// scripts/create-atas.js
// Derives Associated Token Account addresses for the referral wallet.
// Does NOT send any transactions — print-only.

const { PublicKey } = require("@solana/web3.js");

const REFERRAL_WALLET = process.env.JUPITER_FEE_ACCOUNT;
if (!REFERRAL_WALLET) {
  console.error("Set JUPITER_FEE_ACCOUNT in your environment");
  process.exit(1);
}

const TOKENS = {
  WSOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP:  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF:  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
};

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const owner = new PublicKey(REFERRAL_WALLET);

console.log(`Referral wallet: ${owner.toBase58()}\n`);

for (const [name, mintStr] of Object.entries(TOKENS)) {
  const mint = new PublicKey(mintStr);
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  console.log(`${name}`);
  console.log(`  Mint: ${mintStr}`);
  console.log(`  ATA:  ${ata.toBase58()}\n`);
}
