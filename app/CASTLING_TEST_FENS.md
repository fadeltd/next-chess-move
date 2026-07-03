# Castling Test FENs - Reference Guide

These FENs have been tested and correctly show castling recommendations from Stockfish.

## White Kingside Castling (O-O)
**FEN:** `r1bqk2r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4`

**Direct Link:** http://localhost:3000/?fen=r1bqk2r%2Fpppp1ppp%2F2n2n2%2F1B2p3%2F4P3%2F5N2%2FPPPP1PPP%2FRNBQK2R%20w%20KQkq%20-%204%204

**Status:** ✅ Correctly shows O-O as recommended move

---

## White Queenside Castling (O-O-O)
**FEN:** `r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 5 8`

**Direct Link:** http://localhost:3000/?fen=r1bq1rk1%2Fpp2ppbp%2F2np1np1%2F8%2F3NP3%2F2N1BP2%2FPPPQ2PP%2FR3KB1R%20w%20KQ%20-%205%208

**Status:** ✅ Correctly shows O-O-O as recommended move

---

## Black Kingside Castling (O-O)
**FEN:** `r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R b KQkq - 0 5`

**Direct Link:** http://localhost:3000/?f&b&fen=r1bqk2r%2Fpppp1ppp%2F2n2n2%2F2b1p3%2F2B1P3%2F2PP1N2%2FPP3PPP%2FRNBQK2R%20b%20KQkq%20-%200%205

**Status:** ✅ Correctly shows O-O as recommended move

---

## Black Queenside Castling (O-O-O)
**FEN:** `r3k2r/ppp1qppp/2np1n2/4p3/4P3/2N1PN2/PPP1QPPP/R3K2R b q - 0 8`

**Direct Link:** http://localhost:3000/?f&b&fen=r3k2r%2Fppp1qppp%2F2np1n2%2F4p3%2F4P3%2F2N1PN2%2FPPP1QPPP%2FR3K2R%20b%20q%20-%200%208

**Status:** ✅ Correctly shows O-O-O as recommended move

---

## URL Parameter Guide

You can now customize the board with URL parameters:

### Parameters
- `?f` - Flip the board (black on bottom)
- `?b` - Black to move
- `?w` - White to move (default)
- `&fen=<FEN>` - Set the position

### Examples
- `http://localhost:3000/?fen=...` - White, normal board
- `http://localhost:3000/?f&fen=...` - White, flipped board
- `http://localhost:3000/?b&fen=...` - Black to move, normal board
- `http://localhost:3000/?f&b&fen=...` - Black to move, flipped board

### How to Create a Link
1. Set up your desired position and board state
2. Click "Copy Link" in Board Controls > expanded
3. You can manually add `&f` or `&b` parameters to customize
4. Share the link!

---

## How to Use These FENs

1. Click a "Direct Link" above, OR
2. Copy the FEN string
3. Paste it in Board Controls > FEN section
4. Click "Calculate"
5. Stockfish should recommend castling
6. Press Space to apply the move
