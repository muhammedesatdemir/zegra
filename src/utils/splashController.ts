/**
 * Splash Controller
 *
 * Central, deterministic coordinator for hiding the native splash screen.
 *
 * Why separate from _layout.tsx:
 *   expo-router treats files under app/ as route sources. Importing a
 *   helper from a route file (_layout.tsx) across the route tree works,
 *   but lives outside the router's mental model. Keeping this helper in
 *   src/utils keeps the contract explicit: "any screen can signal it is
 *   ready, and the splash will be dismissed at most once."
 *
 * Contract:
 *   - preventAutoHide() is called once, at app module load, from
 *     app/_layout.tsx (before any render). This freezes the native splash.
 *   - The first visible screen calls notifyFirstScreenReady() from its
 *     onLayout. We wait one animation frame so the frame is actually on
 *     screen, then call SplashScreen.hideAsync() exactly once.
 *   - A watchdog can be started from the root layout so the user never
 *     stays behind a splash forever if something upstream misbehaves.
 *
 * Local-first: this controller does not read or write app data.
 */

import * as SplashScreen from 'expo-splash-screen';
import { mark as startupMark } from './startupTimer';

let hideTriggered = false;
let preventCalled = false;

export function preventAutoHide(): void {
  if (preventCalled) return;
  preventCalled = true;

  SplashScreen.preventAutoHideAsync()
    .then(() => startupMark('splash: preventAutoHide resolved'))
    .catch(() => {
      // Already hidden or unsupported — safe to ignore.
    });
  startupMark('splash: preventAutoHide called');
}

export function notifyFirstScreenReady(): void {
  if (hideTriggered) return;
  hideTriggered = true;
  startupMark('splash: hide scheduled (first screen laid out)');

  // One rAF tick ensures the frame the screen just laid out is actually
  // composited before the native splash comes down.
  requestAnimationFrame(() => {
    SplashScreen.hideAsync()
      .then(() => startupMark('splash: hidden (safe point)'))
      .catch(() => {
        // hideAsync rejects if already hidden — nothing to recover.
      });
  });
}

export function startSplashWatchdog(timeoutMs = 4000): () => void {
  const timer = setTimeout(() => {
    if (!hideTriggered) {
      startupMark(`splash: hide via watchdog fallback (${timeoutMs}ms)`);
      notifyFirstScreenReady();
    }
  }, timeoutMs);
  return () => clearTimeout(timer);
}
