import { NavLink, Route, Routes } from "react-router";
import type { ReactNode } from "react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CompetePage from "./pages/CompetePage";
import RankingsPage from "./pages/RankingsPage";
import MatchPage from "./pages/MatchPage";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-4">
      <header className="mb-8 flex items-center justify-between">
        <NavLink to="/" className="text-xl font-semibold text-white">
          Code Compete
        </NavLink>
        <nav className="flex gap-4 text-sm">
          <NavLink to="/compete">Compete</NavLink>
          <NavLink to="/rankings">Rankings</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>
      </header>
      {children}
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/compete" element={<CompetePage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
