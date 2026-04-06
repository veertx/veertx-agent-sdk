const JUPITER_API = 'https://api.jup.ag/v6';

const MINT_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

async function getQuote(inputMint, outputMint, amount, slippageBps) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
    feeBps: '50',
  });

  const res = await fetch(`${JUPITER_API}/quote?${params}`, {
    headers: { 'Authorization': `Bearer ${process.env.JUPITER_API_KEY}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jupiter quote failed (${res.status}): ${body}`);
  }

  return res.json();
}

async function buildSwapTransaction(quoteResponse, userPublicKey) {
  const res = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.JUPITER_API_KEY}`,
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      feeAccount: process.env.JUPITER_FEE_ACCOUNT,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jupiter swap failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.swapTransaction;
}

function getMintAddress(symbol) {
  return MINT_ADDRESSES[symbol.toUpperCase()] || null;
}

module.exports = { getQuote, buildSwapTransaction, getMintAddress };
