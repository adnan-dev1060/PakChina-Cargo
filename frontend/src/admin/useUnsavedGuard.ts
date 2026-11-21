import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useConfirm } from "./ui";

/** Warns before leaving a page (in-app navigation or closing the tab) with unsaved changes. */
export function useUnsavedGuard(dirty: boolean) {
  const confirm = useConfirm();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  const blockerRef = useRef(blocker);
  useEffect(() => {
    blockerRef.current = blocker;
  });

  const blocked = blocker.state === "blocked";
  useEffect(() => {
    if (!blocked) return;
    void confirm({
      title: "Leave without saving?",
      message: "You have unsaved changes on this page. If you leave now, they will be lost.",
      confirmLabel: "Leave page",
      danger: true,
    }).then((leave) => {
      const current = blockerRef.current;
      if (current.state !== "blocked") return;
      if (leave) current.proceed();
      else current.reset();
    });
  }, [blocked, confirm]);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);
}
