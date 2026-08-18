import { useParams } from "react-router";

export default function MatchPage() {
  const { matchId } = useParams();

  return (
    <main>
      <h1 className="text-2xl font-semibold">Match</h1>
      <p className="mt-2 opacity-80">id: {matchId ?? "unknown"}</p>
      <p className="mt-2 opacity-80">
        Editor, board (tests + WPM / thinking), and submit land in a later PR.
      </p>
    </main>
  );
}
