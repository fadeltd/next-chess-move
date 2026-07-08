'use client';

import { useState, useRef, useEffect } from 'react';
import Piece from 'react-chess-pieces';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface BoardPiece {
  id: string;
  type: string;
  square: string | null;
}

interface CanvasBoardProps {
  fen: string;
  onBoardChange: (fen: string) => void;
  orientation: 'white' | 'black';
  suggestedMove?: { from: string; to: string } | null;
}

// Kings are excluded - each side always has exactly one and it can't be removed
const PIECE_ORDER = {
  white: ['P', 'N', 'B', 'R', 'Q'],
  black: ['p', 'n', 'b', 'r', 'q'],
};

const isKing = (type: string) => type === 'K' || type === 'k';

export function CanvasBoard({ fen, onBoardChange, orientation, suggestedMove }: CanvasBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<BoardPiece[]>([]);
  const [draggingPiece, setDraggingPiece] = useState<BoardPiece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [boardSize, setBoardSize] = useState(640);
  const [dragStartSquare, setDragStartSquare] = useState<string | null>(null);
  // Palette piece being dragged, tracked in viewport coordinates for the floating ghost
  const [paletteDrag, setPaletteDrag] = useState<{ type: string; x: number; y: number } | null>(
    null
  );

  const squareSize = boardSize / 8;

  // Parse FEN to pieces
  useEffect(() => {
    const fenParts = fen.split(' ');
    const position = fenParts[0];
    const newPieces: BoardPiece[] = [];
    let id = 0;

    let square = 0;
    for (const char of position) {
      if (char === '/') continue;
      if (!isNaN(Number(char))) {
        square += Number(char);
      } else {
        const file = FILES[square % 8];
        const rank = RANKS[Math.floor(square / 8)];
        const sq = file + rank;
        newPieces.push({ id: `${id++}`, type: char, square: sq });
        square++;
      }
    }
    setPieces(newPieces);
  }, [fen]);

  // Resize board - compact sizing with responsive scaling
  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Responsive sizing: compact but slightly larger on bigger screens
        let maxSize: number;
        let heightMargin: number;
        let widthMargin: number;

        // Mobile (< 768px)
        if (width < 768) {
          maxSize = 340;
          heightMargin = 320;
          widthMargin = 24;
        }
        // Tablet (768px - 1023px)
        else if (width < 1024) {
          maxSize = 360;
          heightMargin = 200;
          widthMargin = 32;
        }
        // Desktop Portrait (1024px - 1279px)
        else if (width < 1280) {
          maxSize = 380;
          heightMargin = 160;
          widthMargin = 40;
        }
        // Desktop Landscape (1280px+)
        else {
          maxSize = 520; // Slightly larger on landscape
          heightMargin = 200;
          widthMargin = 40;
        }

        const availableHeight = height - heightMargin;
        const availableWidth = width - widthMargin;
        const size = Math.max(280, Math.min(availableHeight, availableWidth, maxSize));
        setBoardSize(size);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get display order for files and ranks based on orientation
  const displayFiles = orientation === 'white' ? FILES : [...FILES].reverse();
  const displayRanks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  const getSquareCoords = (square: string): { x: number; y: number } => {
    let file = FILES.indexOf(square[0]);
    let rank = RANKS.indexOf(square[1]);

    // Flip coordinates if board is flipped (black orientation)
    if (orientation === 'black') {
      file = 7 - file;
      rank = 7 - rank;
    }

    return { x: file * squareSize, y: rank * squareSize };
  };

  const getBoardCoords = (e: React.PointerEvent): { x: number; y: number } | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Convert board-relative coordinates to a square name, or null if outside the board
  const coordsToSquare = (x: number, y: number): string | null => {
    let file = Math.floor(x / squareSize);
    let rank = Math.floor(y / squareSize);

    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;

    // Flip coordinates if board is flipped (black orientation)
    if (orientation === 'black') {
      file = 7 - file;
      rank = 7 - rank;
    }

    return FILES[file] + RANKS[rank];
  };

  const handlePiecePointerDown = (piece: BoardPiece, e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getBoardCoords(e);
    if (!coords) return;

    setDraggingPiece(piece);
    setDragStartSquare(piece.square);
    setDragOffset(coords);
  };

  const handlePiecePointerMove = (e: React.PointerEvent) => {
    if (!draggingPiece) return;
    const coords = getBoardCoords(e);
    if (!coords) return;
    setDragOffset(coords);
  };

  const handlePiecePointerUp = (e: React.PointerEvent) => {
    if (!draggingPiece) return;
    const coords = getBoardCoords(e);
    if (!coords) {
      setDraggingPiece(null);
      setDragStartSquare(null);
      return;
    }

    const newSquare = coordsToSquare(coords.x, coords.y);

    if (!newSquare) {
      // Piece released outside the board - remove it (kings snap back instead)
      if (!isKing(draggingPiece.type)) {
        const updatedPieces = pieces.filter((p) => p.id !== draggingPiece.id);
        setPieces(updatedPieces);
        onBoardChange(piecesToFen(updatedPieces));
      }
    } else if (newSquare !== dragStartSquare) {
      const occupant = pieces.find((p) => p.square === newSquare);

      // Kings can't be captured/removed - snap back if dropping onto one
      if (occupant && isKing(occupant.type)) {
        setDraggingPiece(null);
        setDragStartSquare(null);
        return;
      }

      let updatedPieces = pieces
        .filter((p) => p.id !== draggingPiece.id && p.square !== newSquare)
        .concat([{ ...draggingPiece, square: newSquare }]);

      // Handle castling - if king moved 2 squares horizontally, also move the rook
      if (isKing(draggingPiece.type) && draggingPiece.square) {
        const oldFile = FILES.indexOf(draggingPiece.square[0]);
        const newFile = FILES.indexOf(newSquare[0]);
        const isCastling = Math.abs(newFile - oldFile) === 2;

        if (isCastling) {
          const castlingRank = draggingPiece.type === 'K' ? '1' : '8';

          // Kingside castling (king moves right to g-file)
          if (newFile > oldFile) {
            const oldRookSquare = 'h' + castlingRank;
            const newRookSquare = 'f' + castlingRank;

            // Find rook and update its position
            updatedPieces = updatedPieces.map((p) =>
              p.square === oldRookSquare ? { ...p, square: newRookSquare } : p
            );
          }
          // Queenside castling (king moves left to c-file)
          else {
            const oldRookSquare = 'a' + castlingRank;
            const newRookSquare = 'd' + castlingRank;

            // Find rook and update its position
            updatedPieces = updatedPieces.map((p) =>
              p.square === oldRookSquare ? { ...p, square: newRookSquare } : p
            );
          }
        }
      }

      setPieces(updatedPieces);
      onBoardChange(piecesToFen(updatedPieces));
    }
    // Dropped back on the starting square: no position change, just end the drag

    setDraggingPiece(null);
    setDragStartSquare(null);
  };

  const handlePiecePointerCancel = () => {
    setDraggingPiece(null);
    setDragStartSquare(null);
  };

  const handlePalettePointerDown = (type: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPaletteDrag({ type, x: e.clientX, y: e.clientY });
  };

  const handlePalettePointerMove = (e: React.PointerEvent) => {
    if (!paletteDrag) return;
    setPaletteDrag({ ...paletteDrag, x: e.clientX, y: e.clientY });
  };

  const handlePalettePointerUp = (e: React.PointerEvent) => {
    if (!paletteDrag) return;
    setPaletteDrag(null);

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const square = coordsToSquare(e.clientX - rect.left, e.clientY - rect.top);
    if (!square) return; // Released outside the board - don't add

    // Don't replace a king - it can't be removed
    const occupant = pieces.find((p) => p.square === square);
    if (occupant && isKing(occupant.type)) return;

    const newPiece: BoardPiece = { id: Math.random().toString(), type: paletteDrag.type, square };
    const newPcs = pieces.filter((p) => p.square !== square).concat([newPiece]);
    setPieces(newPcs);
    onBoardChange(piecesToFen(newPcs));
  };

  const handlePalettePointerCancel = () => {
    setPaletteDrag(null);
  };

  const piecesToFen = (pcs: BoardPiece[]): string => {
    let fen = '';
    for (let rank = 0; rank < 8; rank++) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const square = FILES[file] + RANKS[rank];
        const piece = pcs.find((p) => p.square === square);
        if (piece) {
          if (empty > 0) fen += empty;
          empty = 0;
          fen += piece.type;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (rank < 7) fen += '/';
    }
    return fen + ' w - - 0 1';
  };

  const isLightSquare = (file: number, rank: number) => (file + rank) % 2 === 0;

  const whiteAtBottom = orientation === 'white';

  const renderPalette = (types: string[]) => (
    <div className="flex gap-1 md:gap-2 justify-center py-1 flex-shrink-0">
      {types.map((type) => (
        <div
          key={type}
          onPointerDown={(e) => handlePalettePointerDown(type, e)}
          onPointerMove={handlePalettePointerMove}
          onPointerUp={handlePalettePointerUp}
          onPointerCancel={handlePalettePointerCancel}
          className="cursor-move hover:scale-110 transition select-none"
          style={{
            width: `${squareSize * 0.5}px`,
            height: `${squareSize * 0.5}px`,
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          title={type}
        >
          <Piece piece={type} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
      {/* Top palette - opponent's pieces */}
      {renderPalette(whiteAtBottom ? PIECE_ORDER.black : PIECE_ORDER.white)}

      {/* Board Container */}
      <div className="flex justify-center flex-1 w-full">
        <div
          ref={boardRef}
          className="relative bg-slate-100 rounded-lg shadow-2xl flex-shrink-0"
          style={{
            width: `${boardSize}px`,
            height: `${boardSize}px`,
          }}
        >
          {/* Board squares */}
          {RANKS.map((rank, rankIdx) =>
            FILES.map((file, fileIdx) => {
              // Keep square names consistent (always a1-h8), don't flip them
              const square = file + rank;
              const isLight = isLightSquare(fileIdx, rankIdx);
              const isSuggested =
                suggestedMove && (suggestedMove.from === square || suggestedMove.to === square);

              // Calculate display position (flipped if orientation='black')
              let displayFileIdx = fileIdx;
              let displayRankIdx = rankIdx;
              if (orientation === 'black') {
                displayFileIdx = 7 - fileIdx;
                displayRankIdx = 7 - rankIdx;
              }

              return (
                <div
                  key={square}
                  className={`absolute ${isLight ? 'bg-amber-100' : 'bg-amber-800'} ${
                    isSuggested ? 'ring-4 ring-yellow-400 ring-inset' : ''
                  }`}
                  style={{
                    left: `${displayFileIdx * squareSize}px`,
                    top: `${displayRankIdx * squareSize}px`,
                    width: `${squareSize}px`,
                    height: `${squareSize}px`,
                  }}
                >
                  {/* Rank labels - always on the left */}
                  {displayFileIdx === 0 && (
                    <div
                      className="absolute text-xs font-bold text-slate-600"
                      style={{
                        left: `${squareSize * -0.35}px`,
                        top: `${squareSize * 0.35}px`,
                        width: `${squareSize * 0.3}px`,
                      }}
                    >
                      {displayRanks[rankIdx]}
                    </div>
                  )}

                  {/* File labels - always at the bottom */}
                  {displayRankIdx === 7 && (
                    <div
                      className="absolute text-xs font-bold text-slate-600"
                      style={{
                        left: `${squareSize * 0.35}px`,
                        top: `${squareSize * 1.05}px`,
                      }}
                    >
                      {displayFiles[fileIdx]}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Pieces */}
          {pieces.map((piece) => {
            if (!piece.square) return null;

            const coords = getSquareCoords(piece.square);
            const isDragging = draggingPiece?.id === piece.id;

            let transform = 'none';
            if (isDragging && dragStartSquare) {
              const startCoords = getSquareCoords(dragStartSquare);
              const offsetX = dragOffset.x - (startCoords.x + squareSize / 2);
              const offsetY = dragOffset.y - (startCoords.y + squareSize / 2);
              transform = `translate(${offsetX}px, ${offsetY}px)`;
            }

            return (
              <div
                key={piece.id}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: `${coords.x}px`,
                  top: `${coords.y}px`,
                  width: `${squareSize}px`,
                  height: `${squareSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: isDragging ? 50 : 10,
                  opacity: isDragging ? 0.8 : 1,
                  transform: transform,
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                onPointerDown={(e) => handlePiecePointerDown(piece, e)}
                onPointerMove={handlePiecePointerMove}
                onPointerUp={handlePiecePointerUp}
                onPointerCancel={handlePiecePointerCancel}
              >
                <div style={{ width: `${squareSize * 0.75}px`, height: `${squareSize * 0.75}px` }}>
                  <Piece piece={piece.type} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom palette - player's pieces */}
      {renderPalette(whiteAtBottom ? PIECE_ORDER.white : PIECE_ORDER.black)}

      {/* Floating ghost piece while dragging from a palette */}
      {paletteDrag && (
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: `${paletteDrag.x - squareSize * 0.375}px`,
            top: `${paletteDrag.y - squareSize * 0.375}px`,
            width: `${squareSize * 0.75}px`,
            height: `${squareSize * 0.75}px`,
            zIndex: 100,
            opacity: 0.8,
          }}
        >
          <Piece piece={paletteDrag.type} />
        </div>
      )}
    </div>
  );
}
