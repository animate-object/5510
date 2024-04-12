import { Result } from "../common";

const WORD_LIST_CACHE_KEY_PREFIX = "fft.word_list";

function wordlistCacheKey(listName: string): string {
  return `${WORD_LIST_CACHE_KEY_PREFIX}.${listName}`;
}

async function fetchWordListFromServer(): Promise<
  Result.Result<string>
> {
  let response: Response;
  try {
    response = await fetch("/compressed-word-data.txt.gz");
  } catch (error: any) {
    return Result.failure(`Failed to fetch word list: ${error.message}`);
  }

  return Result.success(await response.text());
}


async function loadWordList(
  listName: string = "default"
): Promise<Result.Result<string[]>> {
  const cachedList: string | null = localStorage.getItem(
    wordlistCacheKey(listName)
  );
  if (cachedList) {
    console.info("Loaded word list from cache")
    return Result.success(JSON.parse(cachedList));
  }
  console.info("Fetching word list from server")
  const result = await fetchWordListFromServer();
  const words = Result.map(result, (text) => text.split(","));
  Result.map(words, (words) => {
    console.info("Caching word list")
    localStorage.setItem(wordlistCacheKey(listName), JSON.stringify(words));
  });
  return words;
}

export async function fetchWordSet(): Promise<Result.Result<Set<string>>> {
  const result = await loadWordList();
  return Result.map(result, (words) => new Set(words));
}