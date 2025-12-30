import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { fetchPurchasesByBuyer } from "../lib/subgraph";
import { Link } from "react-router-dom";
import { formatPrice } from "../lib/utils";

export default function PurchasesPage() {
  const { address } = useAccount();
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchases", address],
    enabled: !!address,
    queryFn: () => fetchPurchasesByBuyer(address!),
  });

  if (!address) return <div className="card">Connect wallet to view purchases.</div>;

  return (
    <div className="card">
      <div className="section-title">My purchases</div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Failed to load purchases</div>}
      {data?.purchases?.map((p) => (
        <div key={p.id} className="card" style={{ background: "#0f121a" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div>Post #{p.post.id}</div>
              <div style={{ opacity: 0.7 }}>Bought {p.amount}</div>
            </div>
            <div>{formatPrice(p.pricePerUnit)}</div>
          </div>
          <Link to={`/post/${p.post.id}`} className="input" style={{ marginTop: 8, display: "inline-block" }}>
            View post
          </Link>
        </div>
      ))}
      {!isLoading && data?.purchases?.length === 0 && <div>No purchases yet.</div>}
    </div>
  );
}
