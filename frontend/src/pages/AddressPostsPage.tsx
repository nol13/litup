import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPostsByCreator } from "../lib/subgraph";
import { formatPrice } from "../lib/utils";
import { Link } from "react-router-dom";

export default function AddressPostsPage() {
  const { address } = useParams<{ address: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["address-posts", address],
    enabled: !!address,
    queryFn: () => fetchPostsByCreator(address!),
  });

  if (!address) return <div className="card">Missing address</div>;

  return (
    <div className="card">
      <div className="section-title">Posts by {address}</div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Failed to load posts</div>}
      {data?.posts?.map((post) => (
        <div key={post.id} className="card" style={{ background: "#0f121a" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>Post #{post.id}</div>
            <div>{formatPrice(post.price, post.paymentToken)}</div>
          </div>
          <div style={{ marginTop: 6 }}>{post.previewUri}</div>
          <Link to={`/post/${post.id}`} className="input" style={{ marginTop: 8, display: "inline-block" }}>
            View
          </Link>
        </div>
      ))}
      {!isLoading && data?.posts?.length === 0 && <div>No posts for this address.</div>}
    </div>
  );
}
