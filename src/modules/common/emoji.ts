import { Arrays } from ".";

const SUCCESS_EMOJIS = [
  "🎉",
  "👍",
  "👏",
  "🎊",
  "🎈",
  "✅",
  "💯",
  "🔥",
  "🚀",
  "🌟",
  "🏆",
];

const WARN_EMOJIS = ["🤔", "🧐", "🤨"];

const ERROR_EMOJIS = ["😬", "🫣"];

const INFO_EMOJIS = ["👋", "💬"];

type EmojiCategory = "success" | "warning" | "error" | "info";

const EMOJI: Record<EmojiCategory, string[]> = {
  success: SUCCESS_EMOJIS,
  warning: WARN_EMOJIS,
  error: ERROR_EMOJIS,
  info: INFO_EMOJIS,
};

export function emojiFor(category: EmojiCategory): string {
  return Arrays.chooseOne(EMOJI[category], Math.random);
}
