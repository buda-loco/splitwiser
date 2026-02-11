import { describe, it, expect } from 'vitest';
import { getParticipantDisplayName } from './display-name';

describe('getParticipantDisplayName', () => {
  it('returns the name when name is provided', () => {
    expect(getParticipantDisplayName({
      user_id: 'abc12345-6789',
      participant_id: null,
      name: 'Alice',
    })).toBe('Alice');
  });

  it('prioritizes name over user_id and participant_id', () => {
    expect(getParticipantDisplayName({
      user_id: 'abc12345-6789',
      participant_id: 'def12345-6789',
      name: 'Bob',
    })).toBe('Bob');
  });

  it('returns truncated user_id when name is not provided but user_id is', () => {
    expect(getParticipantDisplayName({
      user_id: 'abcdef12-3456-7890-abcd-ef1234567890',
      participant_id: null,
      name: null,
    })).toBe('User abcdef12');
  });

  it('returns truncated user_id (first 8 chars) with "User " prefix', () => {
    expect(getParticipantDisplayName({
      user_id: '12345678-rest-of-uuid',
      name: null,
    })).toBe('User 12345678');
  });

  it('prioritizes user_id over participant_id when name is absent', () => {
    expect(getParticipantDisplayName({
      user_id: 'user1234-5678',
      participant_id: 'part1234-5678',
      name: null,
    })).toBe('User user1234');
  });

  it('returns truncated participant_id when only participant_id is provided', () => {
    expect(getParticipantDisplayName({
      user_id: null,
      participant_id: 'abcdef12-3456-7890-abcd-ef1234567890',
      name: null,
    })).toBe('Participant abcdef12');
  });

  it('returns "Unknown" when no identifying fields are provided', () => {
    expect(getParticipantDisplayName({
      user_id: null,
      participant_id: null,
      name: null,
    })).toBe('Unknown');
  });

  it('returns "Unknown" when all fields are undefined', () => {
    expect(getParticipantDisplayName({})).toBe('Unknown');
  });

  it('treats empty string name as falsy and falls back to user_id', () => {
    expect(getParticipantDisplayName({
      user_id: 'abc12345-6789',
      name: '',
    })).toBe('User abc12345');
  });

  it('treats empty string user_id as falsy and falls back to participant_id', () => {
    expect(getParticipantDisplayName({
      user_id: '',
      participant_id: 'abc12345-6789',
      name: null,
    })).toBe('Participant abc12345');
  });

  it('handles short user_id (less than 8 chars)', () => {
    expect(getParticipantDisplayName({
      user_id: 'short',
      name: null,
    })).toBe('User short');
  });

  it('handles short participant_id (less than 8 chars)', () => {
    expect(getParticipantDisplayName({
      participant_id: 'tiny',
      name: null,
    })).toBe('Participant tiny');
  });

  it('handles exactly 8 char user_id', () => {
    expect(getParticipantDisplayName({
      user_id: 'abcdefgh',
      name: null,
    })).toBe('User abcdefgh');
  });

  it('handles name with spaces and special characters', () => {
    expect(getParticipantDisplayName({
      name: 'Jean-Pierre de la Croix',
    })).toBe('Jean-Pierre de la Croix');
  });

  it('handles whitespace-only name as truthy', () => {
    // A name of just spaces is truthy in JS, so it should be returned
    expect(getParticipantDisplayName({
      user_id: 'abc12345',
      name: '   ',
    })).toBe('   ');
  });
});
