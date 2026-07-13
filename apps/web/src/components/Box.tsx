import React from 'react';

interface BoxProps {
  label: string;
  text: string | number;
}

export const Box: React.FC<BoxProps> = ({ label, text }) => {
  return (
    <div className="border border-lightGray rounded p-2 flex flex-col justify-center items-center w-3/4">
      <div
        className={`text-xs font-light flex justify-center items-center text-center`}
      >
        {label}
      </div>
      <div className="text-sm font-bold text-white mt-3">{text}</div>
    </div>
  );
};
