export const isClientSide = (): boolean => typeof window !== 'undefined';
export const isServerSide = (): boolean => typeof window === 'undefined';
