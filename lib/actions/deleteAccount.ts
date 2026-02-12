'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Account Deletion Server Actions (GDPR Compliance)
 *
 * Implements right to erasure (GDPR Article 17) with cascade deletion
 * and optional grace period for account recovery.
 */

type DeleteAccountResult = {
  success: boolean;
  error?: string;
  scheduledFor?: string;
};

/**
 * Delete user account with cascade to all associated data
 *
 * @param userId - The UUID of the user to delete
 * @param gracePeriod - If true, schedules deletion for 30 days; if false, deletes immediately
 * @returns Result object with success status and optional error message
 */
export async function deleteAccount(
  userId: string,
  gracePeriod: boolean = true
): Promise<DeleteAccountResult> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and matches the deletion target
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication failed' };
    }

    if (user.id !== userId) {
      return { success: false, error: 'Unauthorized: Cannot delete another user\'s account' };
    }

    // If grace period is selected, schedule deletion
    if (gracePeriod) {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      // Update profile with scheduled deletion timestamp
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          deletion_scheduled_at: deletionDate.toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to schedule account deletion:', updateError);
        return { success: false, error: 'Failed to schedule deletion' };
      }

      // TODO: Send email notification with cancellation link
      // This would require email service integration (SendGrid, etc.)

      return {
        success: true,
        scheduledFor: deletionDate.toISOString()
      };
    }

    // Immediate deletion: Cascade through all user data
    return await performAccountDeletion(userId);
  } catch (err) {
    console.error('Account deletion failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Perform immediate account deletion with cascade
 *
 * @param userId - The UUID of the user to delete
 * @returns Result object with success status
 */
async function performAccountDeletion(userId: string): Promise<DeleteAccountResult> {
  const supabase = await createClient();

  try {
    // Step 1: Soft delete all expenses created by user
    const { error: expensesError } = await supabase
      .from('expenses')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('created_by_user_id', userId)
      .eq('is_deleted', false);

    if (expensesError) {
      console.error('Failed to delete expenses:', expensesError);
      return { success: false, error: 'Failed to delete expenses' };
    }

    // Step 2: Soft delete all settlements from/to user
    const { error: settlementsError } = await supabase
      .from('settlements')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('is_deleted', false);

    if (settlementsError) {
      console.error('Failed to delete settlements:', settlementsError);
      return { success: false, error: 'Failed to delete settlements' };
    }

    // Step 3: Delete expense versions for user's expenses
    // First, get all expense IDs created by user
    const { data: userExpenses, error: fetchExpensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('created_by_user_id', userId);

    if (fetchExpensesError) {
      console.error('Failed to fetch user expenses:', fetchExpensesError);
      return { success: false, error: 'Failed to fetch expense history' };
    }

    if (userExpenses && userExpenses.length > 0) {
      const expenseIds = userExpenses.map(e => e.id);

      const { error: versionsError } = await supabase
        .from('expense_versions')
        .delete()
        .in('expense_id', expenseIds);

      if (versionsError) {
        console.error('Failed to delete expense versions:', versionsError);
        // Don't fail the entire operation if versions fail
      }
    }

    // Step 4: Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to delete profile:', profileError);
      return { success: false, error: 'Failed to delete profile' };
    }

    // Step 5: Delete Supabase auth user
    // Note: This requires admin privileges
    // In production, this should be done via a secure admin endpoint
    // or Supabase edge function with service role key
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError);
      // Profile already deleted, so mark as partial success
      return { success: false, error: 'Account data deleted but auth removal failed. Please contact support.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Account deletion cascade failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Deletion cascade failed'
    };
  }
}

/**
 * Cancel a scheduled account deletion
 *
 * @param userId - The UUID of the user to cancel deletion for
 * @returns Result object with success status
 */
export async function cancelAccountDeletion(userId: string): Promise<DeleteAccountResult> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and matches the target
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication failed' };
    }

    if (user.id !== userId) {
      return { success: false, error: 'Unauthorized: Cannot modify another user\'s account' };
    }

    // Clear the deletion_scheduled_at timestamp
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ deletion_scheduled_at: null })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to cancel account deletion:', updateError);
      return { success: false, error: 'Failed to cancel deletion' };
    }

    return { success: true };
  } catch (err) {
    console.error('Cancel deletion failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Check if a user has a scheduled deletion that should execute now
 * This should be called on app initialization
 *
 * @param userId - The UUID of the user to check
 * @returns Whether deletion was performed
 */
export async function checkAndExecuteScheduledDeletion(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('deletion_scheduled_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return false;
    }

    // Check if deletion is scheduled and due
    if (profile.deletion_scheduled_at) {
      const scheduledDate = new Date(profile.deletion_scheduled_at);
      const now = new Date();

      if (scheduledDate <= now) {
        // Deletion is due - execute it
        const result = await performAccountDeletion(userId);
        return result.success;
      }
    }

    return false;
  } catch (err) {
    console.error('Failed to check scheduled deletion:', err);
    return false;
  }
}
