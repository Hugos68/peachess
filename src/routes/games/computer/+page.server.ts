import { getAIDifficulityByName } from '$lib/util';

export const load: PageServerLoad = async ({url}) => {
    const computerName = url.searchParams.get('name');
    let difficulity = getAIDifficulityByName(computerName);
    if (!difficulity) difficulity = 0;
    difficulity = Number.parseInt(difficulity);
    if (difficulity < 0 || difficulity > 4) difficulity = 0;
    return {
        difficulity
    }
};