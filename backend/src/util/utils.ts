export const concatStrings = (array: String[]) => {
    array.sort();
    let concat = "";
    for (let i = 0; i < array.length; i++) {
        concat = concat + array[i];
    }
    return concat;
};
