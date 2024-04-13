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

### ToDo

- more bonuses
  - bonus for paying all your tiles. since it is harder to place all your tiles as the game goes on, the bonus value should increase. I am imagining a flat bonus, perhaps +10, +20, +30, +40, +50
  - bonus multipleir for each word played. Need to think on this but it could be as simple as:
    - after all other bonuses, your turn score is multiplied by the number of words played (e.g. 2x for 2 words, 3x for 3 words)
- tile placement UX
  - considering several models:
    - tap based model: tap a tile or letter to enter placement mode.
      - if a tile is tapped, tapping a letter from your hand will place it there
      - if a letter is tapped, tapping a tile will place the letter there
      - placing one letter limits your next placement to tiles in the same row or column
      - the second placement limits you to the column or row crossing both placed letters
      - could imagine visual indicators to help guide placement like borders/highlights/lowlights
  - drag and drop
    - this sounds nice but it's actually much more touch intensive than tapping... right?
  - should there be a special keyboard based experience? maybe you can click and drag for direction and then type?
    - or maybe on a keyboard you can navigae the cells with your keys and then shift ↓ or shift → to place
    - or maybe simply typing starts down placement and shift+typing starts horizontal placement
- visual feedback and animations
  - would be nice to animate each tile when you play a word
    - perhaps there could be animations or other visual indicators to show the scoring formula being applied?
  - visual feedback for incorrect word
- logo/branding
- help window
- leaderboard
- per IP/device auth (required for leaderboard)
  - would be nice to simply store IPs hashed w/scores
  - could also do simple passwordless auth with email and long oauth sessions
- tip jar
- UX polish
  - color scheme
  - get actual design/UX feedback from someone...
  - custom iconography?
- tech debt
  - single source of truth for mobile breakpoints
