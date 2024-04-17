import { Result } from "../common";

const WORD_LIST_CACHE_KEY_PREFIX = "fft.word_list";

function wordlistCacheKey(listName: string): string {
  return `${WORD_LIST_CACHE_KEY_PREFIX}.${listName}`;
}

const DEFAULT_WORD_LIST_URL =
  "https://raw.githubusercontent.com/animate-object/5510/main/public/wordlist-1.txt";

async function fetchWordListFromServer(
  url: string = DEFAULT_WORD_LIST_URL
): Promise<Result.Result<string>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return Result.failure("Failed to fetch word list.");
    }
    return Result.success(await response.text());
  } catch (error) {
    return Result.failure("Failed to fetch word list.");
  }
}

export async function fetchWordList(
  listName: string = "default"
): Promise<Result.Result<string[]>> {
  const cachedList: string | null = localStorage.getItem(
    wordlistCacheKey(listName)
  );
  if (cachedList) {
    console.info("Loaded word list from cache");
    return Result.success(JSON.parse(cachedList));
  }
  console.info("Fetching word list from server");
  const result = await fetchWordListFromServer();
  const wordsResult = Result.map(result, (text) => text.split(","));
  if (Result.isFailure(wordsResult)) {
    return wordsResult;
  }
  const words = wordsResult.value;
  if (words.length < 1000) {
    return Result.failure("Probable failure to fetch word list.");
  }
  console.info("Caching word list");
  localStorage.setItem(wordlistCacheKey(listName), JSON.stringify(words));
  return Result.success(words);
}
