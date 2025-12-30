import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAccount, usePublicClient } from "wagmi";
import { fetchPost, type PostEntity } from "../lib/subgraph";
import { decryptContent, type EncryptedPayload } from "../lib/lit";
import { LITUP_CONTRACT_ADDRESS } from "../lib/constants";
import { litUpAbi } from "../lib/abi";

export default function ViewPostPage() {
    const { id } = useParams<{ id: string }>();
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const [post, setPost] = useState<PostEntity | null>(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [decrypting, setDecrypting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!id) return;
            setLoading(true);
            try {
                const result = await fetchPost(id);
                setPost(result.post);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load post");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    useEffect(() => {
        async function checkAccess() {
            if (!address || !publicClient || !id) return;
            try {
                const access = await publicClient.readContract({
                    address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
                    abi: litUpAbi,
                    functionName: "hasAccess",
                    args: [address, BigInt(id)],
                });
                setHasAccess(access as boolean);
            } catch (err) {
                console.error("Failed to check access:", err);
            }
        }
        checkAccess();
    }, [address, publicClient, id]);

    const handleDecrypt = async () => {
        if (!post || !id) return;
        setDecrypting(true);
        setError(null);
        try {
            // Fetch encrypted payload from Arweave
            const res = await fetch(post.encryptedUri);
            const payload: EncryptedPayload = await res.json();

            // Decrypt using Lit
            const content = await decryptContent(Number(id), payload);
            setDecryptedContent(content);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to decrypt");
        } finally {
            setDecrypting(false);
        }
    };

    if (loading) {
        return <div className="card">Loading post...</div>;
    }

    if (!post) {
        return <div className="card">Post not found</div>;
    }

    return (
        <div className="card">
            <div className="section-title">Post #{id}</div>

            <div style={{ marginBottom: 16 }}>
                <strong>Creator:</strong> {post.creator.slice(0, 6)}...{post.creator.slice(-4)}
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>Price:</strong> {Number(post.price) / 1e18} ETH
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>Purchases:</strong> {post.minted} / {post.maxSupply === "0" ? "∞" : post.maxSupply}
            </div>

            {post.hidden && (
                <div style={{ marginBottom: 16, color: "#f97316" }}>
                    ⚠️ This post is hidden from new purchases
                </div>
            )}

            <hr style={{ margin: "16px 0", borderColor: "#334155" }} />

            {!address ? (
                <div>Connect your wallet to view content</div>
            ) : !hasAccess ? (
                <div>
                    <p>You don't have access to this content.</p>
                    <p className="subtext">Purchase this post to unlock the content.</p>
                </div>
            ) : decryptedContent ? (
                <div>
                    <div className="section-title">Decrypted Content</div>
                    <div style={{
                        background: "#1e293b",
                        padding: 16,
                        borderRadius: 8,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                    }}>
                        {decryptedContent}
                    </div>
                </div>
            ) : (
                <div>
                    <p>You have access to this content!</p>
                    <button
                        onClick={handleDecrypt}
                        disabled={decrypting}
                        className="input"
                        style={{ background: "#3b82f6", borderColor: "#3b82f6", marginTop: 8 }}
                    >
                        {decrypting ? "Decrypting..." : "Decrypt & View Content"}
                    </button>
                </div>
            )}

            {error && (
                <div style={{ color: "#ef4444", marginTop: 16 }}>{error}</div>
            )}
        </div>
    );
}
