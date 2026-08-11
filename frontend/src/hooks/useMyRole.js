import { useState, useEffect } from 'react';
import { projectsApi } from '../api/services';

// Fetches the current user's role in a project (owner/editor/viewer) and
// returns the whole project object so callers can reuse it (e.g. the member
// list) instead of fetching the project a second time.
// myRole is null while loading; project is null until loaded.
export default function useMyRole(projectId) {
  const [data, setData] = useState({ myRole: null, project: null });

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    projectsApi.get(projectId)
      .then(res => {
        if (!active) return;
        const project = res.data.project;
        setData({ myRole: project?.myRole || null, project: project || null });
      })
      .catch(() => { if (active) setData({ myRole: null, project: null }); });
    return () => { active = false; };
  }, [projectId]);

  return data;
}
