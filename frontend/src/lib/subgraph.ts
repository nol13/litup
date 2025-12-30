export type PostEntity = {
  id: string;
  creator: string;
  price: string;
  previewUri: string;
  encryptedUri: string;
  maxSupply: string;
  minted: string;
  hidden: boolean;
  createdAt: string;
};

export type PurchaseEntity = {
  id: string;
  post: { id: string };
  buyer: string;
  amount: string;
  totalPaid: string;
  pricePerUnit: string;
  timestamp: string;
};

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL as string | undefined;

async function graphRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!SUBGRAPH_URL) {
    throw new Error("Missing VITE_SUBGRAPH_URL");
  }
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Subgraph error ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Subgraph query failed");
  }
  return json.data as T;
}

export function fetchTopPosts(limit = 20) {
  return graphRequest<{ posts: PostEntity[] }>(
    `query TopPosts($limit: Int) {
      posts(first: $limit, where: { hidden: false }, orderBy: minted, orderDirection: desc) {
        id creator price previewUri encryptedUri maxSupply minted hidden createdAt
      }
    }`,
    { limit }
  );
}

export function fetchPost(id: string) {
  return graphRequest<{ post: PostEntity | null }>(
    `query Post($id: ID!) {
      post(id: $id) { id creator price previewUri encryptedUri maxSupply minted hidden createdAt }
    }`,
    { id }
  );
}

export function fetchPurchasesByBuyer(buyer: string) {
  return graphRequest<{ purchases: PurchaseEntity[] }>(
    `query Purchases($buyer: Bytes!) {
      purchases(where: { buyer: $buyer }, orderBy: timestamp, orderDirection: desc) {
        id post { id } buyer amount totalPaid pricePerUnit timestamp
      }
    }`,
    { buyer }
  );
}

export function fetchPostsByCreator(creator: string) {
  return graphRequest<{ posts: PostEntity[] }>(
    `query CreatorPosts($creator: Bytes!) {
      posts(where: { creator: $creator }, orderBy: createdAt, orderDirection: desc) {
        id creator price previewUri encryptedUri maxSupply minted hidden createdAt
      }
    }`,
    { creator }
  );
}

export function fetchCreatorEarnings(creator: string) {
  return graphRequest<{ purchases: { totalPaid: string; post: { creator: string } }[] }>(
    `query CreatorEarnings($creator: Bytes!) {
      purchases(where: { post_: { creator: $creator } }) {
        totalPaid
        post { creator }
      }
    }`,
    { creator }
  );
}

