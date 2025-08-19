import React from 'react';
import { LlmModel } from '../types';

interface ModelSwitcherProps {
  models: LlmModel[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ models, selectedModelId, onModelChange, disabled }) => {
  return (
    <div className="relative">
      <label htmlFor="model-select" className="block text-xs font-medium text-gray-400 mb-1">
        AI Model
      </label>
      <select
        id="model-select"
        value={selectedModelId}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="appearance-none w-full bg-gray-700 border border-gray-600 text-white py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-gray-600 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Select AI Model"
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
};

export default ModelSwitcher;
