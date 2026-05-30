import React from 'react';
import Modal from '../ui/Modal';
import { Mail } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, userInitials }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile" size="sm" className="mt-[100px]">
      <div className="flex flex-col items-center py-6">
        <div className="w-24 h-24 rounded-full bg-brand-blue/10 flex items-center justify-center text-4xl font-bold text-brand-blue border-2 border-brand-blue/20 mb-4 shadow-lg shadow-brand-blue/5">
          {userInitials}
        </div>
        
        <h3 className="text-2xl font-bold text-app-text mb-1">
          {user.first_name} {user.last_name}
        </h3>
        
        <div className="flex items-center gap-2 text-app-text-secondary bg-surface-solid/50 px-4 py-2 rounded-full mt-4 border border-glass-border">
          <Mail size={16} />
          <span>{user.email}</span>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
