import React, { useState, useEffect } from 'react';
import { GEMINI_MODELS } from '../utils/geminiClient';
import * as storage from '../utils/storage';

export const SettingsModal: React.FC<any> = (props) => {
  const { isOpen, onClose, onSave, settings } = props;
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.7-flash');

  useEffect(() => {
    if (isOpen) {
      try {
        // Dynamically fetch the current key from your storage.ts file
        const currentSettings = typeof (storage as any).loadAISettings === 'function' 
          ? (storage as any).loadAISettings() 
          : (settings || {});
          
        setApiKey(currentSettings?.apiKey || '');
        setModel(currentSettings?.model || 'gemini-3.7-flash');
      } catch (e) {
        console.error("Could not load initial settings:", e);
      }
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newSettings = { apiKey, model };
    
    // 1. Force save it to your local device storage using your app's built-in function
    if (typeof (storage as any).saveAISettings === 'function') {
      (storage as any).saveAISettings(newSettings);
    } else {
      localStorage.setItem('ai_settings', JSON.stringify(newSettings));
    }

    // 2. Pass the saved data back to the app exactly how it expects it
    if (typeof onSave === 'function') {
      onSave(newSettings);
    } else if (typeof props.onSaveSettings === 'function') {
      props.onSaveSettings(newSettings);
    } else if (typeof props.onSaveApiKey === 'function') {
      props.onSaveApiKey(apiKey);
      if (typeof props.onSaveModel === 'function') props.onSaveModel(model);
    } else {
      // If we can't find a connection back to the app, force the screen to reload to apply the key
      window.location.reload();
    }
    
    onClose();
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
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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