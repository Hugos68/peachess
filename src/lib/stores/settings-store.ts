import { localStorageStore } from "@skeletonlabs/skeleton";

// All values below are defaults
export const settings: Writable<Settings> = localStorageStore('settings',  {
    animate: true,
    sfx: true,
    premove: false,
    drag: true,
    lastMoveHighlight: true,
    checkHighlight: true
});