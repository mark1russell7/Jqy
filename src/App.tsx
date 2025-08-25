import { useState } from "react";
import { ParentChildLayoutsDemo } from "./components/ParentChildFlow";
import { TestbedMatrix } from "./components/ui/playground/Testbed";

export default function App() {
  const [tab, setTab] = useState<"playground" | "testbed">("playground");

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 12, top: 100, zIndex: 1000 }}>
        <button onClick={() => setTab("playground")} style={{ marginRight: 8 }}>Playground</button>
        <button onClick={() => setTab("testbed")}>Testbed</button>
      </div>
      {tab === "playground" ? <ParentChildLayoutsDemo /> : <TestbedMatrix />}
    </div>
  );
}
