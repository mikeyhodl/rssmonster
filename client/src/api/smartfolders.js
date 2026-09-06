import api from './client';

export const fetchSmartFolders = () =>
  api.get('/smartfolders?withCounts=false');

export const fetchSmartFolderCounts = () =>
  api.get('/smartfolders/counts', { params: { refreshedAt: Date.now() } });

/**
 * Save smart folders
 */
export const saveSmartFolders = (smartFolders) =>
  api.post('/smartfolders', {
    smartFolders: smartFolders || []
  });

/**
 * Fetch smart folder insights
 */
export const fetchSmartFolderInsights = () =>
  api.get('/smartfolders/insights');
