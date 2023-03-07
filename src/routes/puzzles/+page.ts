import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async () => {
    throw redirect(303, `/puzzles/${Math.floor(Math.random() * (50000))}`);
};