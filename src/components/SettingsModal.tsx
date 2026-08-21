import React, { useState, useEffect } from 'react';
import { GEMINI_MODELS } from '../utils/geminiClient';
import { loadAISettings } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Made optional so it doesn't crash if your app doesn't pass them
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  selectedModel?: string;
  onSaveModel?: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey = '',
  onSaveApiKey,
  selectedModel = '',
  onSaveModel,
}) => {
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gemini-3.7-flash');

  // This ensures the input fields show your saved key when you open the modal
  useEffect(() => {
    if (isOpen) {
      try {
        const settings = loadAISettings();
        setKey(settings?.apiKey || apiKey || '');
        setModel(settings?.model || selectedModel || 'gemini-3.7-flash');
      } catch (e) {
        setKey(apiKey || '');
        setModel(selectedModel || 'gemini-3.7-flash');
      }
    }
  }, [isOpen, apiKey, selectedModel]);

  if (!isOpen) return null;

  const handleSave = () => {
    // 1. Save directly to local storage to guarantee it saves
    try {
      const newSettings = { apiKey: key, model: model };
      // Saving to the most common local storage keys used in React apps
      localStorage.setItem('ai-settings', JSON.stringify(newSettings)); 
      localStorage.setItem('medflash-ai-settings', JSON.stringify(newSettings));
      localStorage.setItem('ai_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Could not save settings', e);
    }

    // 2. Only call these IF your parent component actually provided them
    let propsPassed = false;
    if (typeof onSaveApiKey === 'function') {
      onSaveApiKey(key);
      propsPassed = true;
    }
    if (typeof onSaveModel === 'function') {
      onSaveModel(model);
      propsPassed = true;
    }

    // 3. Close the modal
    onClose();

    // 4. If the parent component didn't provide update functions, force a quick reload 
    // to ensure the rest of the app detects the newly saved local storage key.
    if (!propsPassed) {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-white">
        <h2 className="text-xl font-bold mb-4">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gemini API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter Gemini API Key"
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Model Version</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};