# Neon Tetris

A modern, sleek implementation of the classic Tetris game with Apple-inspired design and smooth performance optimizations.

## Features

- Classic Tetris gameplay with modern aesthetics
- Score tracking
- Level progression
- Next piece preview
- Pause functionality
- Game over detection
- Responsive controls
- Performance optimized rendering
- Touch-friendly interface

## Project Structure

```
text
tetris/
├── css/
│   └── styles.css      # Game styles
├── js/
│   └── game.js         # Game logic
├── assets/            # Reserved for future assets
└── tetris.html        # Main game file
```

## Controls

- Left/Right Arrow: Move piece
- Up Arrow: Rotate piece
- Down Arrow: Soft drop
- Space: Hard drop
- P: Pause game

## Mobile Controls

- Swipe left/right: Move piece
- Swipe up: Rotate piece
- Swipe down: Soft drop
- Tap: Rotate piece
- Long press: Hard drop

## Setup

1. Clone or download this repository
2. Open `tetris.html` in a modern web browser
3. Start playing!

## Technical Details

The game uses:

- `requestAnimationFrame` for smooth animations
- DOM element caching for better performance
- Document fragments for efficient DOM updates
- Modern CSS Grid for layout
- Event delegation for input handling

## Browser Support

The game works best in modern browsers that support:

- CSS Grid
- requestAnimationFrame
- ES6+ JavaScript features
