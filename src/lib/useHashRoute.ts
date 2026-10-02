import { useCallback, useEffect, useState } from 'react'

export type PanelKey =
  | 'overview' | 'board' | 'list' | 'calendar'
  | 'issues' | 'pitches' | 'team' | 'settings' | 'new-task'

export const PANEL_KEYS: PanelKey[] = [
  'overview', 'board', 'list', 'calendar',
  'issues', 'pitches', 'team', 'settings', 'new-task',
]

function isPanelKey(value: string): value is PanelKey {
  return (PANEL_KEYS as string[]).includes(value)
}

function readHash(): PanelKey {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return isPanelKey(raw) ? raw : 'overview'
}

/**
 * Panel selection backed by the URL hash.
 *
 * Benefits over useState: a refresh keeps you on the same panel, the browser
 * back button works, and a panel can be linked to directly (e.g. #/board).
 */
export function useHashRoute() {
  const [panel, setPanel] = useState<PanelKey>(readHash)

  useEffect(() => {
    function onHashChange() {
      setPanel(readHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: PanelKey) => {
    // Updating the hash fires hashchange, which sets state, so the panel and
    // the URL can never disagree.
    if (readHash() === next) {
      setPanel(next)
      return
    }
    window.location.hash = `#/${next}`
  }, [])

  return { panel, navigate }
}
