import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = PackageOpen, title = 'Nothing here yet', description = 'Create something to get started.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="p-5 rounded-full bg-dark-surface border border-dark-border">
        <Icon className="w-10 h-10 text-text-secondary" />
      </div>
      <div>
        <h3 className="text-text-primary font-semibold text-lg">{title}</h3>
        <p className="text-text-secondary text-sm mt-1 max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
