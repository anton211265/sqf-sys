import { Button, LoadingOverlay } from '@mantine/core';
import { color } from 'constants/color';
import React, { ReactNode } from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: string; color?: string }>;
  children?: ReactNode; // For custom content like forms
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  onClickPrimaryButtonAction?: () => void;
  onClickSecondaryButtonAction?: () => void;
  loading?: boolean;
  primaryButtonDisabled?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  Icon,
  children,
  primaryButtonLabel,
  secondaryButtonLabel,
  onClickPrimaryButtonAction,
  onClickSecondaryButtonAction,
  loading = false,
  primaryButtonDisabled = false,
}) => {
  return (
    <>
      <div className="bg-white border-zinc-100 border p-7 rounded-xl max-w-sm w-full shadow-sm">
        <div className="bg-white border-zinc-200 p-3.5 mb-4 border rounded-lg w-fit flex justify-center">
          <Icon size="20px" color="#52525B" />
        </div>
        <h1 className="font-semibold text-sm mb-1">{title}</h1>
        <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Custom content (e.g., form inputs) */}
        {children && <div className="mb-4">{children}</div>}

        {/* Buttons */}
        {secondaryButtonLabel ? (
          // 2 buttons layout
          <div
            className={`flex ${
              secondaryButtonLabel
                ? 'justify-center space-x-2'
                : 'justify-center w-full'
            } mt-7`}
          >
            {secondaryButtonLabel && (
              <Button
                variant="outline"
                className="w-auto md:w-auto"
                style={{
                  backgroundColor: 'transparent',
                  color: color.GOLD,
                  borderColor: color.GOLD,
                }}
                fullWidth
                onClick={onClickSecondaryButtonAction}
                loading={loading}
              >
                {secondaryButtonLabel}
              </Button>
            )}
            {primaryButtonLabel && (
              <Button
                variant="primary"
                className="w-full md:w-auto"
                style={{
                  color: '#ffffff',
                  backgroundColor: color.GOLD,
                }}
                fullWidth
                onClick={onClickPrimaryButtonAction}
                loading={loading}
              >
                {primaryButtonLabel}
              </Button>
            )}
          </div>
        ) : (
          // 1 button layout
          <div className="mt-7 w-full">
            <Button
              variant="primary"
              className="w-full md:w-auto"
              style={{
                color: '#ffffff',
                backgroundColor: color.GOLD,
              }}
              loading={loading}
              fullWidth
              onClick={onClickPrimaryButtonAction}
              disabled={primaryButtonDisabled}
            >
              {primaryButtonLabel}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ActionCard;
