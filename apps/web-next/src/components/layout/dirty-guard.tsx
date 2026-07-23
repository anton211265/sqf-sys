import * as React from 'react';

interface DirtyGuardValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** Runs the action unless unsaved changes exist and the user cancels. */
  confirmIfDirty: (action: () => void) => void;
}

const DirtyGuardContext = React.createContext<DirtyGuardValue>({
  isDirty: false,
  setDirty: () => undefined,
  confirmIfDirty: (action) => action(),
});

/**
 * Dirty-state guard from the RBAC portal spec: navigating away from a
 * screen with unsaved access-control changes must prompt first. Screens
 * mark themselves dirty; PortalLayout routes its nav clicks through
 * confirmIfDirty. A beforeunload listener covers hard navigation.
 * (Router-level blocking needs react-router's data router — revisit if the
 * app migrates to createBrowserRouter.)
 */
export function DirtyGuardProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const confirmIfDirty = React.useCallback(
    (action: () => void) => {
      if (
        !isDirty ||
        window.confirm(
          'You have unsaved access control changes. Leave without saving?',
        )
      ) {
        setDirty(false);
        action();
      }
    },
    [isDirty],
  );

  const value = React.useMemo(
    () => ({ isDirty, setDirty, confirmIfDirty }),
    [isDirty, confirmIfDirty],
  );
  return (
    <DirtyGuardContext.Provider value={value}>
      {children}
    </DirtyGuardContext.Provider>
  );
}

export const useDirtyGuard = () => React.useContext(DirtyGuardContext);
