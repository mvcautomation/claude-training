import { useState } from "react";
import Home from "./Home.jsx";
import Room from "./Room.jsx";

export default function App() {
  // null until the player has picked a code + name, then we mount the Room
  const [session, setSession] = useState(null);

  if (!session) return <Home onEnter={setSession} />;
  return <Room code={session.code} name={session.name} onLeave={() => setSession(null)} />;
}
