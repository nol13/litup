import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  PostCreated,
  Purchased,
  PriceUpdated,
  PostHidden as PostHiddenEvent,
} from "../generated/LitUpAccess/LitUpAccess";
import { Post, Purchase } from "../generated/schema";

function postIdToString(postId: BigInt): string {
  return postId.toString();
}

export function handlePostCreated(event: PostCreated): void {
  const id = postIdToString(event.params.postId);
  const post = new Post(id);

  post.creator = event.params.creator;
  post.price = event.params.price;
  post.previewUri = event.params.previewUri;
  post.encryptedUri = event.params.encryptedUri;
  post.maxSupply = event.params.maxSupply;
  post.minted = BigInt.zero();
  post.hidden = false;
  post.createdAt = event.block.timestamp;

  post.save();
}

export function handlePurchased(event: Purchased): void {
  const id = postIdToString(event.params.postId);
  const post = Post.load(id);
  if (post == null) {
    return;
  }

  post.minted = post.minted.plus(event.params.amount);
  post.save();

  const purchaseId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const purchase = new Purchase(purchaseId);
  purchase.post = id;
  purchase.buyer = event.params.buyer;
  purchase.amount = event.params.amount;
  purchase.totalPaid = event.params.totalPaid;
  purchase.pricePerUnit = event.params.pricePerUnit;
  purchase.txHash = event.transaction.hash;
  purchase.timestamp = event.block.timestamp;
  purchase.save();
}

export function handlePriceUpdated(event: PriceUpdated): void {
  const id = postIdToString(event.params.postId);
  const post = Post.load(id);
  if (post == null) {
    return;
  }

  post.price = event.params.price;
  post.save();
}

export function handlePostHidden(event: PostHiddenEvent): void {
  const id = postIdToString(event.params.postId);
  const post = Post.load(id);
  if (post == null) {
    return;
  }

  post.hidden = event.params.hidden;
  post.save();
}
