# 5x5x10

Five hands of five letters in ten minutes.

### [Play the Game](https://animate-object.github.io/5510/)

## Rules

- play one or more words by placing letters from your hand on the board
- tiles are played in one in "one direction" per turn, down or across
  - so if you play across, all your placed letters must be in the same row. - similarly if you place down, all your letters must be in the same column
- bonus tiles improve the base score of your words
  - letter bonuses (double and triple) multiple the value of the letter placed on them
  - word bonuses multiply the value of the whole word.
  - word bonuses are applied after letter bonuses
  - a bonus is applied every time you form a new word that includes the bonus tile. That is if I play CAT across and the C is on a bonus tile, then I play CAUGHT down on the next turn, the bonus on the C tile will be applied both times
- NOTE: you do not need to play a 'contiguous crossword' as in some similar games. That is, your words do not have to be connected.
- the game ends when you play your last of five hands OR ten minutes is elapsed.

## Dev Log

### Priotized List

1. tile placement UX - tap & keyboard controls ✅
2. menu
3. game persistence
4. leaderboard
5. animations/UX polish
6. logo/branding
7. "share" overhaul
8. tip jar

### ToDo

- visual feedback and animations
  - would be nice to animate each tile when you play a word
    - perhaps there could be animations or other visual indicators to show the scoring formula being applied?
  - visual feedback for incorrect word
- logo/branding
- leaderboard etc
  - best possible score
  - average turn analysis
  - interesting summary information like
    - "today's most popular plays"
  - per IP/device auth (required for leaderboard)
    - would be nice to simply store IPs hashed w/scores
    - could also do simple passwordless auth with email and long oauth sessions
- game persistence
- tip jar
- UX polish
  - color scheme
  - get actual design/UX feedback from someone...
  - custom iconography?
- tech debt
  - single source of truth for mobile breakpoints
- menu
  - today's game menu option

### Done

- help window

- more bonuses

  - bonus for paying all your tiles. since it is harder to place all your tiles as the game goes on, the bonus value should increase. I am imagining a flat bonus, perhaps +10, +20, +30, +40, +50
  - bonus multipleir for each word played. Need to think on this but it could be as simple as:
    - after all other bonuses, your turn score is multiplied by the number of words played (e.g. 2x for 2 words, 3x for 3 words)

- tile placement UX
  - added tap to place
  - added keyboard controls
