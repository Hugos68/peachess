import { localStorageStore } from "@skeletonlabs/skeleton";

// All values below are defaults
export const settings: Writable<Settings> = localStorageStore('settings',  {
    animate: true,
    animationDuration: 250,
    sfx: true,
    premove: false,
    drag: true,
    lastMoveHighlight: true,
    checkHighlight: true
});