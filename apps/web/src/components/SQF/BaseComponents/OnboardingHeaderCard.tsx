import React from 'react';

interface HeaderProps {
  title: string;
  description: string;

  // Accepting the icon as a React component, @tabler/icons-react are just normal React components that accept all these as a props
  // size='20px' equivalent to height='20px' width='20px'
  Icon: React.ComponentType<{ size?: string; color?: string }>;
}

export const OnboardingHeaderCard: React.FC<HeaderProps> = ({
  title,
  description,
  Icon,
}) => {
  return (
    // No need to have a div since there will be a wrapper in parent component
    <> 
      <div className="border-2 border-zinc-200 p-2.5 my-2.5 rounded">
        <Icon size="20px" color="black" />
      </div>
      <div className="font-bold">{title}</div>
      <div className="text-zinc-400 text-xs">{description}</div>
    </>
  );
};
