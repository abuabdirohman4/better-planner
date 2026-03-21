export interface RpcData {
  success: boolean;
  task?: unknown;
  milestone_id?: string;
  quest_id?: string;
  error?: string;
}

export function validateRpcSuccess(data: RpcData): void {
  if (!data.success) {
    throw new Error(data.error || 'RPC operation failed');
  }
}

export function formatRpcResult(data: RpcData) {
  return {
    success: true,
    task: data.task,
    milestoneId: data.milestone_id,
    questId: data.quest_id,
  };
}
