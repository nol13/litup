import { useState, useEffect, useMemo } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { fetchPostsByCreator, fetchCreatorEarnings, type PostEntity } from "../lib/subgraph";
import { LITUP_CONTRACT_ADDRESS } from "../lib/constants";
import { litUpAbi } from "../lib/abi";
import { formatEther } from "viem";

export default function CreatorDashboard() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const [posts, setPosts] = useState<PostEntity[]>([]);
    const [totalEarnings, setTotalEarnings] = useState<bigint>(0n);
    const [loading, setLoading] = useState(true);
    const [togglingPost, setTogglingPost] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!address) return;
            setLoading(true);
            try {
                const [postsResult, earningsResult] = await Promise.all([
                    fetchPostsByCreator(address.toLowerCase()),
                    fetchCreatorEarnings(address.toLowerCase()),
                ]);
                setPosts(postsResult.posts);

                // Sum up earnings
                const total = earningsResult.purchases.reduce((acc, p) => {
                    return acc + BigInt(p.totalPaid);
                }, 0n);
                setTotalEarnings(total);
            } catch (err) {
                console.error("Failed to load dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [address]);

    const handleToggleHidden = async (postId: string, currentlyHidden: boolean) => {
        setTogglingPost(postId);
        try {
            await writeContractAsync({
                address: LITUP_CONTRACT_ADDRESS as `0x${string}`,
                abi: litUpAbi,
                functionName: "hidePost",
                args: [BigInt(postId), !currentlyHidden],
            });
            // Update local state optimistically
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, hidden: !currentlyHidden } : p
            ));
        } catch (err) {
            console.error("Failed to toggle post visibility:", err);
        } finally {
            setTogglingPost(null);
        }
    };

    const postEarnings = useMemo(() => {
        return posts.reduce((acc, post) => {
            const earnings = BigInt(post.price) * BigInt(post.minted);
            acc[post.id] = earnings;
            return acc;
        }, {} as Record<string, bigint>);
    }, [posts]);

    if (!address) {
        return (
            <div className="card">
                <div className="section-title">Creator Dashboard</div>
                <p>Connect your wallet to view your posts and earnings.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card">
                <div className="section-title">Creator Dashboard</div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="section-title">Creator Dashboard</div>

            <div style={{
                background: "#1e293b",
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div>
                    <div className="subtext">Total Earnings</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>
                        {formatEther(totalEarnings)} ETH
                    </div>
                </div>
                <div>
                    <div className="subtext">Total Posts</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>
                        {posts.length}
                    </div>
                </div>
            </div>

            {posts.length === 0 ? (
                <p className="subtext">You haven't created any posts yet.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            style={{
                                background: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: 8,
                                padding: 16,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                                        Post #{post.id}
                                        {post.hidden && (
                                            <span style={{
                                                marginLeft: 8,
                                                fontSize: 12,
                                                background: "#f97316",
                                                padding: "2px 6px",
                                                borderRadius: 4
                                            }}>
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <div className="subtext">
                                        Price: {Number(post.price) / 1e18} ETH •
                                        Sold: {post.minted} / {post.maxSupply === "0" ? "∞" : post.maxSupply}
                                    </div>
                                    <div style={{ marginTop: 8 }}>
                                        Earnings: <strong>{formatEther(postEarnings[post.id] || 0n)} ETH</strong>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <a
                                        href={`/view/${post.id}`}
                                        className="input"
                                        style={{
                                            background: "transparent",
                                            borderColor: "#3b82f6",
                                            textDecoration: "none",
                                            padding: "6px 12px",
                                            fontSize: 14
                                        }}
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => handleToggleHidden(post.id, post.hidden)}
                                        disabled={togglingPost === post.id}
                                        className="input"
                                        style={{
                                            background: post.hidden ? "#22c55e" : "#f97316",
                                            borderColor: post.hidden ? "#22c55e" : "#f97316",
                                            padding: "6px 12px",
                                            fontSize: 14
                                        }}
                                    >
                                        {togglingPost === post.id ? "..." : post.hidden ? "Show" : "Hide"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
