/// permutations of length N from word
export const permutations = (letters: string, n: number): string[] => {
  // base cases

  // impossible to permute more letters than we have
  if (n > letters.length) {
    return [];
  }

  // if we are only picking one letter,
  // return the letters as an array
  if (n === 1) {
    return letters.split("");
  }

  // if there is only one letter left
  // return it as an array
  // note this implies n === 1 from condition above
  if (letters.length === 1) {
    return [letters];
  }

  let result: string[] = [];

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const rest = letters.slice(0, i) + letters.slice(i + 1);
    const restPerms = permutations(rest, n - 1);
    for (const perm of restPerms) {
      result.push(letter + perm);
    }
  }
  return result;
};

/// Permutations of any length from string
export const allPermutations = (letters: string): string[] => {
  const result: string[] = [];
  for (let i = 1; i <= letters.length; i++) {
    result.push(...permutations(letters, i));
  }
  return result;
};

(window as any).p = permutations;
(window as any).ap = allPermutations;
