import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar-inner">
      <div className="brand">
        <h2>Woujamind</h2>
      </div>
      <nav>
        <ul>
          <li>New Sprite</li>
          <li>My Library</li>
          <li>Settings</li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
