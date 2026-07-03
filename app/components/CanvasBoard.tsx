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

const PIECE_ORDER = {
  white: ['P', 'N', 'B', 'R', 'Q', 'K'],
  black: ['p', 'n', 'b', 'r', 'q', 'k'],
};

const PIECE_LABELS: Record<string, string> = {
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
};

export function CanvasBoard({ fen, onBoardChange, orientation, suggestedMove }: CanvasBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<BoardPiece[]>([]);
  const [draggingPiece, setDraggingPiece] = useState<BoardPiece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [boardSize, setBoardSize] = useState(640);
  const [dragStartSquare, setDragStartSquare] = useState<string | null>(null);

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
          maxSize = 520;  // Slightly larger on landscape
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


  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();

    if ('touches' in e || 'changedTouches' in e) {
      const touchList = 'touches' in e ? e.touches : (e as any).changedTouches;
      if (!touchList || touchList.length === 0) return null;
      const touch = touchList[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      const mouseEvent = e as React.MouseEvent;
      return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top,
      };
    }
  };

  const handleMouseDown = (piece: BoardPiece, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setDraggingPiece(piece);
    setDragStartSquare(piece.square);
    setDragOffset({
      x: coords.x,
      y: coords.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingPiece || !boardRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setDragOffset({
      x: coords.x,
      y: coords.y,
    });
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingPiece || !boardRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    // Find which square the mouse is over
    let file = Math.round(coords.x / squareSize - 0.5);
    let rank = Math.round(coords.y / squareSize - 0.5);

    // Flip coordinates if board is flipped (black orientation)
    if (orientation === 'black') {
      file = 7 - file;
      rank = 7 - rank;
    }

    // Check if piece was dragged outside the board
    if (file < 0 || file > 7 || rank < 0 || rank > 7) {
      // Prevent removing kings from the board
      if (draggingPiece.type === 'K' || draggingPiece.type === 'k') {
        // Snap king back to original square - do nothing
      } else {
        // Remove the piece by filtering it out
        const updatedPieces = pieces.filter((p) => p.id !== draggingPiece.id);
        setPieces(updatedPieces);
        const newFen = piecesToFen(updatedPieces);
        onBoardChange(newFen);
      }
    } else {
      // Piece dropped on board - place it on the square
      const newSquare = FILES[file] + RANKS[rank];
      let updatedPieces = pieces
        .filter((p) => p.id !== draggingPiece.id && p.square !== newSquare)
        .concat([{ ...draggingPiece, square: newSquare }]);

      // Handle castling - if king moved 2 squares horizontally, also move the rook
      if ((draggingPiece.type === 'K' || draggingPiece.type === 'k') && draggingPiece.square) {
        const oldFile = FILES.indexOf(draggingPiece.square[0]);
        const newFile = file;
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

      // Update FEN with the new pieces
      const newFen = piecesToFen(updatedPieces);
      onBoardChange(newFen);
    }

    setDraggingPiece(null);
    setDragStartSquare(null);
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
  const showWhitePaletteAtTop = !whiteAtBottom;
  const showWhitePaletteAtBottom = whiteAtBottom;
  const showBlackPaletteAtTop = whiteAtBottom;
  const showBlackPaletteAtBottom = !whiteAtBottom;

  const addPieceFromPalette = (type: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find which square the mouse is over
    let file = Math.round(x / squareSize - 0.5);
    let rank = Math.round(y / squareSize - 0.5);

    // Flip coordinates if board is flipped (black orientation)
    if (orientation === 'black') {
      file = 7 - file;
      rank = 7 - rank;
    }

    // Clamp to board boundaries
    const clampedFile = Math.max(0, Math.min(7, file));
    const clampedRank = Math.max(0, Math.min(7, rank));

    const square = FILES[clampedFile] + RANKS[clampedRank];

    if (square) {
      const newId = Math.random().toString();
      const newPiece: BoardPiece = { id: newId, type, square };
      const newPcs = [...pieces, newPiece];
      setPieces(newPcs);
      onBoardChange(piecesToFen(newPcs));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
      {/* Top palette - White pieces if board flipped */}
      {showWhitePaletteAtTop && (
        <div className="flex gap-1 md:gap-2 justify-center py-1 flex-shrink-0 overflow-x-auto">
          {PIECE_ORDER.white.map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer!.effectAllowed = 'copy';
                e.dataTransfer!.setData('piece', type);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => addPieceFromPalette(type, e)}
              className="cursor-move hover:scale-110 transition select-none"
              style={{
                width: `${squareSize * 0.5}px`,
                height: `${squareSize * 0.5}px`,
              }}
              title={type}
            >
              <Piece piece={type} />
            </div>
          ))}
        </div>
      )}

      {/* Top palette - Black pieces if board normal */}
      {showBlackPaletteAtTop && (
        <div className="flex gap-1 md:gap-2 justify-center py-1 flex-shrink-0 overflow-x-auto">
          {PIECE_ORDER.black.map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer!.effectAllowed = 'copy';
                e.dataTransfer!.setData('piece', type);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => addPieceFromPalette(type, e)}
              className="cursor-move hover:scale-110 transition select-none"
              style={{
                width: `${squareSize * 0.5}px`,
                height: `${squareSize * 0.5}px`,
              }}
              title={type}
            >
              <Piece piece={type} />
            </div>
          ))}
        </div>
      )}

      {/* Board Container */}
      <div className="flex justify-center flex-1 w-full">
        <div
          ref={boardRef}
          className="relative bg-slate-100 rounded-lg shadow-2xl flex-shrink-0"
          style={{
            width: `${boardSize}px`,
            height: `${boardSize}px`,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            const type = e.dataTransfer.getData('piece');
            if (type) {
              addPieceFromPalette(type, e);
            }
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
                }}
                onMouseDown={(e) => handleMouseDown(piece, e)}
                onTouchStart={(e) => handleMouseDown(piece, e)}
              >
                <div style={{ width: `${squareSize * 0.75}px`, height: `${squareSize * 0.75}px` }}>
                  <Piece piece={piece.type} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom palette - Black pieces if board flipped */}
      {showBlackPaletteAtBottom && (
        <div className="flex gap-1 md:gap-2 justify-center py-1 flex-shrink-0">
          {PIECE_ORDER.black.map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer!.effectAllowed = 'copy';
                e.dataTransfer!.setData('piece', type);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => addPieceFromPalette(type, e)}
              className="cursor-move hover:scale-110 transition select-none"
              style={{
                width: `${squareSize * 0.5}px`,
                height: `${squareSize * 0.5}px`,
              }}
              title={type}
            >
              <Piece piece={type} />
            </div>
          ))}
        </div>
      )}

      {/* Bottom palette - White pieces if board normal */}
      {showWhitePaletteAtBottom && (
        <div className="flex gap-1 md:gap-2 justify-center py-1 flex-shrink-0">
          {PIECE_ORDER.white.map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer!.effectAllowed = 'copy';
                e.dataTransfer!.setData('piece', type);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => addPieceFromPalette(type, e)}
              className="cursor-move hover:scale-110 transition select-none"
              style={{
                width: `${squareSize * 0.5}px`,
                height: `${squareSize * 0.5}px`,
              }}
              title={type}
            >
              <Piece piece={type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
