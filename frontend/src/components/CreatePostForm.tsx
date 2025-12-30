import { useState } from "react";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { uploadEncryptedContent, uploadPreview } from "../lib/irys";
import { LITUP_CONTRACT_ADDRESS } from "../lib/constants";
import { litUpAbi } from "../lib/abi";
import { toPriceUnits } from "../lib/utils";

export default function CreatePostForm() {
  const [preview, setPreview] = useState("");
  const [gated, setGated] = useState("");
  const [price, setPrice] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus("Preparing...");
    try {
      if (!address) throw new Error("Connect wallet first");
      if (!publicClient) throw new Error("Missing public client");

      const nextId = (await publicClient.readContract({
        address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
        abi: litUpAbi,
        functionName: "nextPostId",
        args: [],
      })) as bigint;

      const priceUnits = toPriceUnits(price || "0");
      const supply = maxSupply ? BigInt(maxSupply) : 0n;

      const { encryptContent } = await import("../lib/lit");
      const encrypted = await encryptContent(Number(nextId), gated);
      const previewUri = await uploadPreview({ preview });
      const encryptedUri = await uploadEncryptedContent(encrypted);

      await writeContractAsync({
        address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
        abi: litUpAbi,
        functionName: "createPost",
        args: [previewUri, encryptedUri, priceUnits, supply],
      });
      setStatus("Post published on-chain");
      setPreview("");
      setGated("");
      setPrice("");
      setMaxSupply("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="section-title">Create post</div>
      <form onSubmit={handleSubmit} className="row" style={{ flexDirection: "column" }}>
        <label className="label">
          Preview text
          <textarea
            className="input"
            rows={3}
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            placeholder="Short teaser or intro"
          />
        </label>
        <label className="label">
          Gated content
          <textarea
            className="input"
            rows={6}
            value={gated}
            onChange={(e) => setGated(e.target.value)}
            placeholder="Content to encrypt and store on Arweave"
          />
        </label>
        <div className="row" style={{ width: "100%" }}>
          <label className="label" style={{ flex: 1 }}>
            Price (ETH)
            <input
              className="input"
              type="number"
              min="0"
              step="0.0001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 for free"
            />
          </label>
          <label className="label" style={{ width: 160 }}>
            Max supply
            <input
              className="input"
              type="number"
              min="0"
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              placeholder="0 = unlimited"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="input"
          style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
        >
          {loading ? "Preparing..." : "Publish post"}
        </button>
        {status && <div style={{ marginTop: 8 }}>{status}</div>}
      </form>
    </div>
  );
}
