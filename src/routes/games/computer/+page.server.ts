export const load: PageServerLoad = async ({url}) => {
    let difficulity = url.searchParams.get('difficulity');
    if (!difficulity) difficulity = 0;
    if (typeof difficulity !== typeof 0 | 1 | 2 | 3 | 4) difficulity = 0;
    return {
        difficulity
    }
};