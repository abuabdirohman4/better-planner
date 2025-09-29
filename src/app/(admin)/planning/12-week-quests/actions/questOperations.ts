"use server";

import { revalidatePath } from "next/cache";
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import type { Quest } from '../hooks/useQuestState';
import type { RankedQuest } from '../hooks/useRankingCalculation';

/**
 * Save quests to database
 * Handles both creating new quests and updating existing ones
 */
export async function saveQuests(
  quests: Quest[], 
  year: number, 
  quarter: number
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const questsWithId = quests.filter(q => q.id);
    const newQuests = quests.filter(q => !q.id && q.title.trim() !== "");

    // Update existing quests
    if (questsWithId.length > 0) {
      for (const quest of questsWithId) {
        const { error } = await supabase
          .from('quests')
          .update({ 
            title: quest.title,
            updated_at: new Date().toISOString()
          })
          .eq('id', quest.id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      }
    }

    // Create new quests
    if (newQuests.length > 0) {
      const questsToInsert = newQuests.map(q => ({
        title: q.title,
        label: q.label,
        year,
        quarter,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('quests')
        .insert(questsToInsert);

      if (error) {
        throw error;
      }
    }

    revalidatePath('/planning/12-week-quests');
    return { 
      success: true, 
      message: "Quest berhasil disimpan/diupdate!" 
    };
  } catch (error) {
    const errorInfo = handleApiError(error, 'menyimpan data');
    return { 
      success: false, 
      message: errorInfo.message || 'Gagal menyimpan quest'
    };
  }
}

/**
 * Finalize quests with pairwise results and priority scores
 * Commits the final ranking and sets top 3 quests as main quests
 */
export async function finalizeQuests(
  pairwiseResults: { [key: string]: string },
  questsWithScore: { id: string; title: string; priority_score: number }[],
  year: number,
  quarter: number
): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update quests with priority scores
    for (const quest of questsWithScore) {
      const { error } = await supabase
        .from('quests')
        .update({ 
          priority_score: quest.priority_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', quest.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    }

    // Save pairwise results
    const { error: pairwiseError } = await supabase
      .from('pairwise_results')
      .upsert({
        user_id: user.id,
        year,
        quarter,
        results_json: pairwiseResults,
        is_finalized: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,year,quarter'
      });

    if (pairwiseError) {
      throw pairwiseError;
    }

    // Note: Main quest marking removed as is_main_quest column doesn't exist in database
    // Priority scores are already saved above

    revalidatePath('/planning/12-week-quests');
    revalidatePath('/planning/main-quests');

    return { 
      success: true, 
      message: "Prioritas berhasil ditentukan dan 3 Main Quest telah ditetapkan!",
      url: '/planning/main-quests'
    };
  } catch (error) {
    const errorInfo = handleApiError(error, 'mengupdate data');
    return { 
      success: false, 
      message: errorInfo.message || 'Gagal commit main quest'
    };
  }
}

/**
 * Get all quests for a specific quarter
 */
export async function getAllQuestsForQuarter(
  year: number, 
  quarter: number
): Promise<{ id?: string, title: string, label?: string }[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('quests')
      .select('id, title, label')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    handleApiError(error, 'memuat data');
    return [];
  }
}

/**
 * Get pairwise results for a specific quarter
 */
export async function getPairwiseResults(
  year: number, 
  quarter: number
): Promise<{ [key: string]: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pairwise_results')
      .select('results_json')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No pairwise results found, return empty object
        return {};
      }
      throw error;
    }

    return data?.results_json || {};
  } catch (error) {
    handleApiError(error, 'memuat data');
    return {};
  }
}
