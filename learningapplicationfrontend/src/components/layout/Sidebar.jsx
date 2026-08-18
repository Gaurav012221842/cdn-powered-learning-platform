import React from 'react';

const Sidebar = ({ links = [] }) => {
  return (
    <aside style={{ width: '240px', background: '#0f172a', padding: '24px', minHeight: 'calc(100vh - 65px)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {links.map((link, idx) => (
          <li key={idx}>
            <a href={link.path} style={{ display: 'block', padding: '10px', borderRadius: '6px', color: '#94a3b8' }}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
