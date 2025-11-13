export default function transpose2DArray<ArrayType>(
  array: ArrayType[][],
): ArrayType[][] {
  // Handle empty array case
  if (array.length === 0 || !array[0]) {
    return [];
  }

  // Transpose the array safely
  return array[0].map((_, index) =>
    array
      .map((row) => row[index])
      .filter((item): item is ArrayType => item !== undefined),
  );
}
