export default function transpose2DArray<ArrayType>(
    array: ArrayType[][]
): ArrayType[][] {
    return array[0].map((_, index) => array.map((row) => row[index]));
}
