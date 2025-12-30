import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import type { ReactNode } from "react";
import ConnectSection from "./components/ConnectSection";
import CreatePostForm from "./components/CreatePostForm";
import PostFeed from "./components/PostFeed";
import PostDetailPage from "./pages/PostDetailPage";
import PurchasesPage from "./pages/PurchasesPage";
import MyPostsPage from "./pages/MyPostsPage";
import AddressPostsPage from "./pages/AddressPostsPage";
import ViewPostPage from "./pages/ViewPostPage";
import CreatorDashboard from "./pages/CreatorDashboard";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="badge">BASE · LIT · ARWEAVE</div>
          <h1 style={{ margin: "6px 0" }}>LitUp</h1>
          <p className="subtext">Encrypt locally, gate with Lit, store on Arweave, pay in ETH.</p>
        </div>
        <nav className="row" style={{ gap: 12, fontWeight: 600 }}>
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/purchases">My purchases</Link>
          <Link to="/my-posts">My posts</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

function HomePage() {
  return (
    <Layout>
      <div className="hero">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: "4px 0 8px" }}>Own your content pipeline</h2>
            <p className="subtext">
              Upload previews and encrypted posts to Arweave, gate access with Lit on Base, and
              charge in ETH. No backend required—wallet, Lit, Arweave, and the subgraph power the flow.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <span className="pill">Client-side encryption</span>
              <span className="pill">Lit access control</span>
              <span className="pill">Arweave permanence</span>
            </div>
          </div>
          <div className="card" style={{ minWidth: 260, maxWidth: 320 }}>
            <div className="section-title" style={{ marginTop: 0 }}>Quick start</div>
            <ol style={{ paddingLeft: 16, margin: 0, color: "#cfd6e8" }}>
              <li>Connect wallet on Base</li>
              <li>Create a post (preview + gated)</li>
              <li>Bundlr uploads + Lit key</li>
              <li>Publish and get paid in ETH</li>
            </ol>
          </div>
        </div>
      </div>
      <ConnectSection />
      <div className="grid" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="section-title">Top posts</div>
          <p className="subtext">See what’s trending by purchases.</p>
        </div>
        <div className="card">
          <div className="section-title">Create & earn</div>
          <p className="subtext">Publish encrypted drops and set your ETH price.</p>
        </div>
        <div className="card">
          <div className="section-title">Your library</div>
          <p className="subtext">Browse everything you’ve bought and unlock instantly.</p>
        </div>
      </div>
      <PostFeed />
      <CreatePostForm />
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/:id" element={<Layout><PostDetailPage /></Layout>} />
        <Route path="/view/:id" element={<Layout><ViewPostPage /></Layout>} />
        <Route path="/purchases" element={<Layout><PurchasesPage /></Layout>} />
        <Route path="/my-posts" element={<Layout><MyPostsPage /></Layout>} />
        <Route path="/dashboard" element={<Layout><CreatorDashboard /></Layout>} />
        <Route path="/address/:address" element={<Layout><AddressPostsPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
