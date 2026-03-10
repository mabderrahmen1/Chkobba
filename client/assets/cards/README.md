# Card Assets

This folder is reserved for card graphics if needed.

## Current Implementation

The game currently uses **CSS-styled cards** with Unicode suit symbols instead of image files. This approach:

- Reduces asset loading time
- Scales to any size without pixelation
- Keeps the project simple with fewer files
- Works offline without needing to download images

## Card Rendering

Cards are rendered in `client/js/game.js` using the `createCardElement()` method which generates HTML/CSS cards with:

- Rank display (A, 2-7, J, Q, K)
- Suit symbols (♥, ♦, ♣, ♠)
- Color coding (red for hearts/diamonds, white for clubs/spades)

## Adding Custom Card Graphics (Optional)

If you want to use custom SVG or PNG card graphics:

1. Add your card images to this folder
2. Name them using the format: `{rank}_{suit}.svg` (e.g., `A_hearts.svg`, `7_diamonds.svg`)
3. Update the `createCardElement()` method in `client/js/game.js` to use `<img>` tags instead of CSS

Example file names:
```
A_hearts.svg
2_hearts.svg
...
K_hearts.svg
A_diamonds.svg
...
K_spades.svg
```

## Recommended SVG Card Libraries

If you want to use pre-made SVG cards:

1. **svg-cards** (https://github.com/hayeah/svg-cards) - MIT licensed, clean design
2. **playing-cards** (https://github.com/henrywhitaker3/playing-cards) - Simple SVG cards
3. **Custom design** - Create your own in Figma/Illustrator
