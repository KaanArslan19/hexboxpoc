"use client";

import React from 'react';
import { Dialog } from '@headlessui/react';

interface RestoreDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onDiscard: () => void;
}

export default function RestoreDraftModal({
  isOpen,
  onClose,
  onRestore,
  onDiscard
}: RestoreDraftModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-4">Resume Your Progress?</Dialog.Title>
          <Dialog.Description className="mb-6 text-gray-600">
            We found a saved draft from your previous session. Would you like to 
            restore your progress or start fresh?
          </Dialog.Description>

          <div className="flex justify-end gap-4">
            <button 
              onClick={onDiscard}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              Start Fresh
            </button>
            <button 
              onClick={onRestore}
              className="px-4 py-2 bg-blueColor text-white rounded hover:bg-blue-700 transition-colors"
            >
              Restore Progress
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
