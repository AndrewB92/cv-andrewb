'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

/** Initializes Clarity when a project ID is available to the client; renders nothing. */
export default function MicrosoftClarity() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    if (!projectId) return;

    try {
      // The SDK deduplicates its script, including Strict Mode effect replay.
      Clarity.init(projectId);
    } catch {
      // A blocked analytics script must not affect rendering.
    }
  }, [projectId]);

  return null;
}
