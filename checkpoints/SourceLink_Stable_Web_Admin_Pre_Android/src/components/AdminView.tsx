import React from 'react';
import { User } from '../types';
import { AdminPortal } from './admin/AdminPortal';

interface AdminViewProps {
  currentUser: User | null;
  onNavigateTab?: (tab: any) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onNavigateTab }) => {
  return (
    <div className="w-full min-h-screen bg-slate-950">
      <AdminPortal onBackToApp={() => onNavigateTab && onNavigateTab('landing')} />
    </div>
  );
};
