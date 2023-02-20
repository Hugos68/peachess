import { localStorageStore } from "@skeletonlabs/skeleton";

export const settings: Writable<Settings> = localStorageStore('settings',  {
    animate: true,
    animationDuration: 100,
    sfx: true,
    premove: false,
    drag: true,
    lastMoveHighlight: true,
    checkHighlight: true
});