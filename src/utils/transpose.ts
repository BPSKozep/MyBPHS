export default function transpose2DArray<ArrayType>(
    array: ArrayType[][],
    disabled: boolean
): ArrayType[][] {
    if (disabled) return array;

    return array[0].map((_, index) => array.map((row) => row[index]));
}
