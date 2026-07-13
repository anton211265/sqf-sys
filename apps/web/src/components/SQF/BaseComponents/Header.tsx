import { color } from 'constants/color';
import React from 'react';

interface HeaderProps {
  title: string;
  description: string;
}

const Header: React.FC<HeaderProps> = ({ title, description }) => {
  return (
    <div>
      <h2
        className="font-bold text-sm"
        style={{
          fontSize: '13px',
        }}
      >
        {title}
      </h2>
      <p
        className="text-sm font-light"
        style={{
          color: color.DARKGREY,
          fontSize: '12px',
        }}
      >
        {description}
      </p>
    </div>
  );
};

export default Header;
