import { useAccount, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { fetchPostsByCreator } from "../lib/subgraph";
import { Link } from "react-router-dom";
import { formatPrice, toPriceUnits } from "../lib/utils";
import { litUpAbi } from "../lib/abi";
import { LITUP_CONTRACT_ADDRESS } from "../lib/constants";
import { useState } from "react";

export default function MyPostsPage() {
  const { address } = useAccount();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-posts", address],
    enabled: !!address,
    queryFn: () => fetchPostsByCreator(address!),
  });

  if (!address) return <div className="card">Connect wallet to view your posts.</div>;
  return (
    <div className="card">
      <div className="section-title">My posts</div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Failed to load posts</div>}
      {data?.posts?.map((post) => (
        <CreatorPostCard key={post.id} post={post} refresh={refetch} />
      ))}
      {!isLoading && data?.posts?.length === 0 && <div>No posts yet.</div>}
    </div>
  );
}

function CreatorPostCard({ post, refresh }: { post: any; refresh: () => void }) {
  const { writeContractAsync, isPending } = useWriteContract();
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");

  const handleUpdate = async () => {
    try {
      const nextPrice = price || post.price;
      await writeContractAsync({
        address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
        abi: litUpAbi,
        functionName: "updatePrice",
        args: [BigInt(post.id), toPriceUnits(nextPrice)],
      });
      setStatus("Updated price");
      refresh();
    } catch (e) {
      setStatus("Failed to update");
    }
  };

  return (
    <div className="card" style={{ background: "#0f121a" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Post #{post.id}</div>
          <div style={{ opacity: 0.8 }}>Minted: {post.minted}</div>
          <div>Price: {formatPrice(post.price)}</div>
        </div>
        <Link to={`/post/${post.id}`}>View</Link>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <input className="input" placeholder="New price" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button
          className="input"
          disabled={isPending}
          onClick={handleUpdate}
          style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
        >
          {isPending ? "Updating..." : "Update price"}
        </button>
      </div>
      {status && <div style={{ marginTop: 6 }}>{status}</div>}
    </div>
  );
}
