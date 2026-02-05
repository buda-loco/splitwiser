'use client';

import { useEffect, useState } from 'react';
import {
  getAllTags,
  getTagStats,
  renameTag,
  mergeTags,
  deleteTag,
} from '@/lib/db/stores';

export function TagManagement() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagStats, setTagStats] = useState<Map<string, number>>(new Map());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load tags and stats on mount
  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    try {
      const allTags = await getAllTags();
      const stats = await getTagStats();
      setTags(allTags);
      setTagStats(stats);
    } finally {
      setLoading(false);
    }
  }

  // Rename tag handler
  async function handleRename(oldTag: string) {
    if (!newTagName || newTagName === oldTag) {
      setEditingTag(null);
      setNewTagName('');
      return;
    }

    await renameTag(oldTag, newTagName);
    setEditingTag(null);
    setNewTagName('');
    await loadTags();
  }

  // Merge tags handler
  async function handleMerge() {
    if (selectedTags.size < 2) return;

    const tagArray = Array.from(selectedTags);
    const [target, ...sources] = tagArray;

    await mergeTags(sources, target);
    setSelectedTags(new Set());
    await loadTags();
  }

  // Delete tag handler
  async function handleDelete(tag: string) {
    const count = tagStats.get(tag) || 0;
    if (!confirm(`Delete tag "${tag}" from ${count} expense${count !== 1 ? 's' : ''}?`)) {
      return;
    }

    await deleteTag(tag);
    await loadTags();
  }

  // Toggle tag selection
  function toggleTagSelection(tag: string) {
    const newSelection = new Set(selectedTags);
    if (newSelection.has(tag)) {
      newSelection.delete(tag);
    } else {
      newSelection.add(tag);
    }
    setSelectedTags(newSelection);
  }

  // Start editing a tag
  function startEditing(tag: string) {
    setEditingTag(tag);
    setNewTagName(tag);
  }

  // Cancel editing
  function cancelEditing() {
    setEditingTag(null);
    setNewTagName('');
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading tags...
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No tags found. Create expenses with tags to see them here.
      </div>
    );
  }

  return (
    <div className="pb-safe">
      {/* Merge button - fixed at top when 2+ tags selected */}
      {selectedTags.size >= 2 && (
        <div className="sticky top-[57px] z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <button
            onClick={handleMerge}
            className="w-full bg-ios-blue text-white font-medium text-base py-3 rounded-lg active:opacity-80 transition-opacity"
          >
            Merge {selectedTags.size} tags into &quot;{Array.from(selectedTags)[0]}&quot;
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            The first selected tag will be kept, others will be merged into it
          </p>
        </div>
      )}

      {/* Tag list */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {tags.map((tag) => (
          <div
            key={tag}
            className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3"
          >
            {/* Checkbox for selection */}
            <input
              type="checkbox"
              checked={selectedTags.has(tag)}
              onChange={() => toggleTagSelection(tag)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-ios-blue focus:ring-ios-blue focus:ring-offset-0"
            />

            {/* Tag name (editable if editingTag === tag) */}
            <div className="flex-1 min-w-0">
              {editingTag === tag ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(tag);
                      } else if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    className="flex-1 px-2 py-1 text-base border border-ios-blue rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-ios-blue"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(tag)}
                    className="text-ios-blue font-medium text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-gray-500 dark:text-gray-400 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="font-medium text-base text-black dark:text-white truncate">
                  #{tag}
                </div>
              )}
            </div>

            {/* Usage count */}
            <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {tagStats.get(tag) || 0} {tagStats.get(tag) === 1 ? 'expense' : 'expenses'}
            </div>

            {/* Action buttons */}
            {editingTag !== tag && (
              <div className="flex items-center gap-2">
                {/* Rename button */}
                <button
                  onClick={() => startEditing(tag)}
                  className="p-2 text-ios-blue active:opacity-50 transition-opacity"
                  aria-label={`Rename tag ${tag}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(tag)}
                  className="p-2 text-red-500 dark:text-red-400 active:opacity-50 transition-opacity"
                  aria-label={`Delete tag ${tag}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
