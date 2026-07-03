# ♟️ Next Chess Move

A modern chess analysis tool powered by Stockfish that allows you to analyze positions, calculate best moves, and explore chess variations with an intuitive web interface.

**🔗 Live Demo:** [nextchessmove.fadeltd.dev](https://nextchessmove.fadeltd.dev)

---

## ✨ Features

### Core Chess Functionality

- **Interactive Chess Board** - Drag-and-drop piece placement with visual feedback
- **Stockfish Integration** - Real-time move analysis and evaluation
- **Position Analysis** - Calculate best moves with depth and evaluation scores
- **Castling Support** - Manual castling by dragging king 2 squares, automatic rights management
- **FEN Support** - Load and share positions via FEN notation

### Advanced Features

- **Undo/Redo** - Full move history with keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)
- **Board Controls** - Reset, flip board, capture all pieces
- **Material Score** - Real-time material balance tracking
- **Move Highlighting** - Visual arrows showing suggested moves
- **Player Selection** - Analyze from White or Black perspective
- **Castling Rights Management** - Automatic disable when king/rooks move
- **Move Preservation** - All moves stored persistently during game

### UI/UX

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **URL Sharing** - Share positions with parameters: `?f` (flip), `?b` (black to move), `?fen=...`
- **Keyboard Shortcuts**:
  - `Space` - Calculate move or apply suggested move
  - `W` / `B` - Switch player to move
  - `F` - Flip board
  - `R` - Reset board
  - `Cmd+Z` - Undo
  - `Cmd+Shift+Z` - Redo

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
next-chess-move/
├── app/
│   ├── components/
│   │   ├── ChessApp.tsx          # Main application component
│   │   ├── CanvasBoard.tsx       # Chess board rendering with drag-and-drop
│   │   ├── Controls.tsx          # UI controls for analysis and board management
│   │   ├── StatusBar.tsx         # Material score display
│   │   └── ...
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/
│   └── useStockfish.ts           # Stockfish integration hook
├── CASTLING_TEST_FENS.md         # Reference FENs for testing castling
├── IMPLEMENTATION_STATUS.md      # Feature implementation status
└── README.md
```

---

## 🎯 Key Implementation Details

### Castling

- Manual castling: Drag king 2 squares horizontally
- Automatic rook movement to correct square
- Permanent disabling when king or rooks move
- Restoration of rights on undo
- Stockfish-recommended castling moves

### Move History & Undo/Redo

- Full position history stored for each move
- Undo and redo with Cmd+Z / Cmd+Shift+Z
- Move history cleared on reset
- Redo history truncated when new move made after undo

### URL Parameters

Share and restore board state via URL:

```
https://nextchessmove.fadeltd.dev/?f&b&fen=...
```

- `f` - Flip board (black on bottom)
- `b` - Black to move
- `fen=<FEN>` - Position in FEN notation

### Stockfish Analysis

- Real-time analysis with depth display
- Evaluation scores (centipawns or mate)
- Nodes per second (NPS) monitoring
- Draw avoidance detection

---

## 📚 Testing Castling

See [CASTLING_TEST_FENS.md](CASTLING_TEST_FENS.md) for tested positions where Stockfish recommends castling moves.

Quick test:

```
https://nextchessmove.fadeltd.dev/?fen=r1bqk2r%2Fpppp1ppp%2F2n2n2%2F1B2p3%2F4P3%2F5N2%2FPPPP1PPP%2FRNBQK2R%20w%20KQkq%20-%204%204
```

---

## 🛠️ Technologies

- **Framework**: [Next.js 16](https://nextjs.org)
- **Language**: TypeScript
- **Chess Logic**: [chess.js](https://github.com/jhlywa/chess.js)
- **Chess Engine**: [Stockfish.js](https://github.com/nmrugg/stockfish.js)
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- [Report bugs and issues](https://github.com/fadeltd/next-chess-move/issues)
- Suggest new features
- Submit pull requests

---

## 🐛 Report Issues

Found a bug or have a feature request? [Open an issue](https://github.com/fadeltd/next-chess-move/issues) on GitHub.

---

## 📧 Author

- Email: fadeltd@hotmail.com
- Website: [nextchessmove.fadeltd.dev](https://nextchessmove.fadeltd.dev)

---

## 🙏 Acknowledgments

- [Stockfish](https://stockfishchess.org) - Open-source chess engine
- [chess.js](https://github.com/jhlywa/chess.js) - Chess move validation
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

---

## 📝 Changelog

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for feature implementation details and status.
