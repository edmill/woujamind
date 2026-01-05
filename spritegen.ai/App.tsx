import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import './styles.css';

const App: React.FC = () => {
  useEffect(() => {
    document.title = 'Woujamind';
  }, []);

  return (
    <div className="app-root">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      <main className="main-content">
        <header>
          <h1>Woujamind</h1>
          <p>Create and manage your sprites with Woujamind.</p>
        </header>
        {/* The rest of the application UI goes here */}
      </main>
    </div>
  );
};

export default App;
