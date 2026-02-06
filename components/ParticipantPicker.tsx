'use client';

import { useState } from 'react';
import { useParticipants, type ParticipantWithDetails } from '@/hooks/useParticipants';
import { useTagSuggestions } from '@/hooks/useTagSuggestions';

interface ParticipantPickerProps {
  selected: ParticipantWithDetails[];
  onChange: (participants: ParticipantWithDetails[]) => void;
  selectedTags?: string[];
  singleSelect?: boolean;
}

/**
 * iOS-native participant selection component with smart suggestions
 *
 * Features:
 * - Shows tag-based participant suggestions when tags selected
 * - Shows recent participants from expense history
 * - Toggle selection with visual feedback
 * - Add new participants inline
 * - Expandable suggestions (show 5, expand to 10)
 * - iOS-native button and input styling
 */
export function ParticipantPicker({ selected, onChange, selectedTags, singleSelect }: ParticipantPickerProps) {
  const { recent, frequent, loading } = useParticipants();
  const { suggestedParticipants: tagSuggestions } = useTagSuggestions(selectedTags || []);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');

  const handleSelect = (participant: ParticipantWithDetails) => {
    // Toggle selection
    const isSelected = selected.some(
      p =>
        p.user_id === participant.user_id &&
        p.participant_id === participant.participant_id
    );

    if (singleSelect) {
      // Single select mode: replace selection or clear if same
      if (isSelected) {
        onChange([]);
      } else {
        onChange([participant]);
      }
    } else {
      // Multi-select mode: toggle
      if (isSelected) {
        onChange(
          selected.filter(
            p =>
              p.user_id !== participant.user_id ||
              p.participant_id !== participant.participant_id
          )
        );
      } else {
        onChange([...selected, participant]);
      }
    }
  };

  const handleAddNew = () => {
    if (!newParticipantName.trim()) return;

    // Create new participant (non-registered)
    const newParticipant: ParticipantWithDetails = {
      participant_id: crypto.randomUUID(),
      user_id: null,
      name: newParticipantName.trim(),
      email: null,
    };

    if (singleSelect) {
      onChange([newParticipant]);
    } else {
      onChange([...selected, newParticipant]);
    }
    setNewParticipantName('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Who was involved?
        </label>

        {/* Selected participants */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map(p => (
              <button
                key={p.user_id || p.participant_id}
                onClick={() => handleSelect(p)}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium active:bg-blue-600 transition-colors"
                type="button"
              >
                {p.name} ×
              </button>
            ))}
          </div>
        )}

        {/* Tag-based suggestions (highest priority when tags selected) */}
        {tagSuggestions.length > 0 && selectedTags && selectedTags.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Suggested for &apos;{selectedTags[0]}&apos;
            </p>
            <div className="flex flex-wrap gap-2">
              {tagSuggestions.map(p => {
                const isSelected = selected.some(
                  s => s.user_id === p.user_id && s.participant_id === p.participant_id
                );

                return (
                  <button
                    key={p.user_id || p.participant_id}
                    onClick={() => handleSelect(p)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-ios-blue dark:bg-gray-700 dark:text-gray-200 dark:border-blue-500 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                    type="button"
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent suggestions (always show top 5) */}
        {!loading && recent.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recent.slice(0, showAllSuggestions ? 10 : 5).map(p => {
                const isSelected = selected.some(
                  s => s.user_id === p.user_id && s.participant_id === p.participant_id
                );

                return (
                  <button
                    key={p.user_id || p.participant_id}
                    onClick={() => handleSelect(p)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                    type="button"
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Show more button */}
        {recent.length > 5 && (
          <button
            onClick={() => setShowAllSuggestions(!showAllSuggestions)}
            className="text-sm text-blue-600 dark:text-blue-400 mb-3 active:text-blue-700 dark:active:text-blue-300"
            type="button"
          >
            {showAllSuggestions ? 'Show less' : 'Show more suggestions'}
          </button>
        )}

        {/* Add new participant */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); } }}
            placeholder="Add someone new..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <button
            onClick={handleAddNew}
            disabled={!newParticipantName.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-600 transition-colors"
            type="button"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
