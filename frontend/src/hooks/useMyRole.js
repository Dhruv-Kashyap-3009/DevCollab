import { useState, useEffect } from 'react';
import { projectsApi } from '../api/services';

// Fetches the current user's role in a project (owner/editor/viewer).
// Returns null while loading, then the role string.
export default function useMyRole(projectId) {
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    projectsApi.get(projectId)
      .then(res => { if (active) setMyRole(res.data.project?.myRole || null); })
      .catch(() => { if (active) setMyRole(null); });
    return () => { active = false; };
  }, [projectId]);

  return myRole;
}
