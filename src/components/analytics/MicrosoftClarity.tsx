'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

/** Initializes Clarity when a project ID is available to the client; renders nothing. */
export default function MicrosoftClarity() {
  const projectId = process.env.CLARITY_PROJECT_ID;

  useEffect(() => {
    if (!projectId) return;

    Clarity.init(projectId);
  }, [projectId]);

  return null;
}