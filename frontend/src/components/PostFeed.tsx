import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchTopPosts } from "../lib/subgraph";
import { formatPrice } from "../lib/utils";

export default function PostFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["top-posts"],
    queryFn: () => fetchTopPosts(20),
  });

  return (
    <div className="card">
      <div className="section-title">Top posts</div>
      {isLoading && <div>Loading feed...</div>}
      {error && <div>Failed to load feed</div>}
      {data?.posts?.map((post) => (
        <div key={post.id} className="card" style={{ background: "#0f121a" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700 }}>Post #{post.id}</div>
              <div style={{ opacity: 0.8 }}>By <Link to={`/address/${post.creator}`}>{post.creator}</Link></div>
            </div>
            <div style={{ fontWeight: 700 }}>
              {formatPrice(post.price)}
            </div>
          </div>
          <div style={{ marginTop: 8 }}>{post.previewUri}</div>
          <Link to={`/post/${post.id}`} className="input" style={{ display: "inline-block", marginTop: 10, background: "#22c55e", borderColor: "#22c55e" }}>
            View & buy
          </Link>
        </div>
      ))}
    </div>
  );
}
