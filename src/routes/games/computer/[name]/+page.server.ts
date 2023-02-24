import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
    const name = event.params.name.toLowerCase();

    // Check if requested computer is an existing computer
    if (!['george', 'bob', 'will', 'matt', 'peter'].includes(name)) {
        throw redirect(303, `/games?${new URLSearchParams({message: 'The computer you tried to play does not exist'})}`);
    }

    return {
        name
    }
};