import React from 'react';

/**
 * Resilient wrapper around React.lazy to handle ChunkLoadError / failed module fetches.
 * When the server is redeployed, old JS hashes are deleted and replaced by new ones.
 * If the user's browser has an old index.html cached, navigation will trigger a 404
 * on stale JS chunks. This wrapper catches the error and forces a clean browser reload.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('[LazyLoad] Failed to import component, attempting reload...', error);
      
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      
      // Prevent infinite reload loops by checking if reload happened in the last 10 seconds
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
      
      throw error;
    }
  });
}
