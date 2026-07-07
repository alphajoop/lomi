export const testUser = {
  merchantId: '904d003c-3736-41d4-90a5-9de74d404fd7',
  organizationId: '0979ec77-9fb1-4c9a-8c55-d7fb6c182c9c',
  environment: 'live' as const,
};

export function createMockSupabase() {
  const rpc = jest.fn();
  const from = jest.fn();
  return {
    rpc,
    from,
    getClient: () => ({ rpc, from }),
    mockRpc: (
      name: string,
      data: unknown,
      error: null | { message: string } = null,
    ) => {
      rpc.mockImplementation(async (fn: string) => {
        if (fn === name) return { data, error };
        return { data: null, error: null };
      });
    },
  };
}
