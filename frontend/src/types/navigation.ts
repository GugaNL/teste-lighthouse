export interface ProductRouteState {
  returnTo?: string;
  highlightId?: string;
}

export function readRouteState(state: unknown): ProductRouteState {
  if (!state || typeof state !== 'object') return {};
  const { returnTo, highlightId } = state as Record<string, unknown>;
  return {
    returnTo: typeof returnTo === 'string' ? returnTo : undefined,
    highlightId: typeof highlightId === 'string' ? highlightId : undefined,
  };
}
