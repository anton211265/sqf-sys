import React from 'react';
import Ghost from '../assets/img/ghost.png';
import { Link } from 'react-router-dom';

export const ErrorComponent = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <div>
        <img
          src={Ghost}
          alt="Nothing here"
          style={{ backgroundColor: 'inherit' }}
        />
      </div>
      <div style={{ marginTop: '20px' }}>
        <span style={{ fontSize: '20px', color: '#fff' }}>
          Nothing to see here
        </span>
      </div>
      <div style={{ marginTop: '20px' }}>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};
