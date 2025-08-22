import React from 'react';
import ParentChildFlow from './components/ParentChildFlow';
import './App.css';

function App() {
  const config = {
    id: 'parent',
    position: { x: 100, y: 50 },
    layout: (children, parentPos) =>
      children.map((_, idx) => ({
        x: parentPos.x + idx * 200,
        y: parentPos.y + 150,
      })),
    children: [
      { id: 'child1' },
      { id: 'child2' },
      { id: 'child3' },
    ],
  };

  return <ParentChildFlow config={config} />;
}

export default App;
