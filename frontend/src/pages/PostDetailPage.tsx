import { useParams } from "react-router-dom";
import { useAccount, useWriteContract, useBalance, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { fetchPost } from "../lib/subgraph";
import { formatPrice } from "../lib/utils";
import { LITUP_CONTRACT_ADDRESS } from "../lib/constants";
import { litUpAbi } from "../lib/abi";
import { useState } from "react";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const [decrypted, setDecrypted] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["post", id],
    enabled: !!id,
    queryFn: () => fetchPost(id!),
  });

  const post = data?.post;

  const { writeContractAsync, isPending } = useWriteContract();

  const { data: hasAccess } = useReadContract({
    address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
    abi: litUpAbi,
    functionName: "hasAccess",
    args: [address || "0x0000000000000000000000000000000000000000", post ? BigInt(post.id) : 0n],
    query: { enabled: !!address && !!post },
  });

  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const handlePurchase = async () => {
    if (!post || !address) return;
    setTxStatus("");
    const amount = 1n;
    const price = BigInt(post.price || "0");
    try {
      await writeContractAsync({
        address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
        abi: litUpAbi,
        functionName: "purchase",
        args: [BigInt(post.id), amount],
        value: price * amount,
      });
      setTxStatus("Purchase sent");
    } catch (e) {
      setTxStatus("Purchase failed");
    }
  };

  const handleDecrypt = async () => {
    if (!post) return;
    try {
      const res = await fetch(post.encryptedUri);
      const json = (await res.json()) as any;
      const { decryptContent } = await import("../lib/lit");
      const text = await decryptContent(Number(post.id), json);
      setDecrypted(text);
    } catch (e) {
      setDecrypted("Failed to decrypt or fetch content");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="card">
      <div className="section-title">Post #{post.id}</div>
      <div style={{ marginBottom: 8 }}>Creator: {post.creator}</div>
      <div style={{ marginBottom: 8 }}>Preview: {post.previewUri}</div>
      <div style={{ marginBottom: 8 }}>Price: {formatPrice(post.price)}</div>
      <div className="row" style={{ gap: 12 }}>
        <button
          className="input"
          onClick={handlePurchase}
          disabled={isPending || !address}
          style={{ background: "#22c55e", borderColor: "#22c55e" }}
        >
          {isPending ? "Buying..." : "Buy"}
        </button>
        <button className="input" onClick={handleDecrypt} disabled={hasAccess === false}>
          Unlock & decrypt
        </button>
      </div>
      {txStatus && <div style={{ marginTop: 6 }}>{txStatus}</div>}
      {decrypted && <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{decrypted}</div>}
      {nativeBalance && (
        <div style={{ marginTop: 8, opacity: 0.7 }}>
          Balance: {nativeBalance.formatted} {nativeBalance.symbol}
        </div>
      )}
    </div>
  );
}
