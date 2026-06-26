import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './EnhancedButton';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 bg-[#1a2332] border border-[#263248] rounded-full flex items-center justify-center mb-6">
        <Icon size={40} className="text-[#8390ac]" />
      </div>
      <h3 className="text-2xl font-bold text-[#f3f6ff] mb-2">{title}</h3>
      <p className="text-[#9aa5bf] max-w-md mb-8">{description}</p>
      {actionLabel && onAction && (
        <div className="flex gap-3">
          <Button onClick={onAction} size="lg">
            {actionLabel}
          </Button>
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction} size="lg">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
