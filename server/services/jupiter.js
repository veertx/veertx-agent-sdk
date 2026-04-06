const JUPITER_API = 'https://api.jup.ag/swap/v1';

const MINT_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

const FEE_ACCOUNTS = {
  'So11111111111111111111111111111111111111112': '6DMvfbKtNcwBfNNFrhF9btdCVRUmM4njB9FyQnvYnjMc',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '83FEgmXi5X4W9CCvjJMwfKayRMGEBkJ7k3cF4CNCvfPx',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '7bL63Tn3U82TyBq6K4iUv2oofjhvbW5pWh1kHvDWaNWq',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'GfgDhYANRgXH5NhbXGZVvxK5DSNfQJRLUJHMv7nDBDdG',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': '266SuoPo1SzeAxfpAwLQYyqtARNHAfmF3pXwfsQze5MV',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': '7ARDPen4JV8uMiH7f4iYAC4wy9Hiv781eEZiW9HEYAmp',
};

async function getQuote(inputMint, outputMint, amount, slippageBps) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
  });

  if (FEE_ACCOUNTS[outputMint]) {
    params.set('platformFeeBps', '50');
  }

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
      ...(FEE_ACCOUNTS[quoteResponse.outputMint] && {
        feeAccount: FEE_ACCOUNTS[quoteResponse.outputMint],
      }),
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
