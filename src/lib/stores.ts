
import { writable, type Writable } from 'svelte/store';

export const currentlyDraggedPiece: Writable<HTMLElement | null> = writable(null);

export const fromSquare: Writable<string | null>  = writable(null);

export const toSquare: Writable<string | null>  = writable(null);
