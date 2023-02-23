export const load: PageServerLoad = async ({url}) => {
    let difficulity = url.searchParams.get('difficulity');
    if (!difficulity) difficulity = 0;
    difficulity = Number.parseInt(difficulity);
    if (difficulity < 0 || difficulity > 4) difficulity = 0;
    return {
        difficulity
    }
};