'use client';

import { useState, useRef, useEffect } from 'react';

const PIECE_SYMBOLS: Record<string, string> = {
  // White pieces
  wK: '♔',
  wQ: '♕',
  wR: '♖',
  wB: '♗',
  wN: '♘',
  wP: '♙',
  // Black pieces
  bK: '♚',
  bQ: '♛',
  bR: '♜',
  bB: '♝',
  bN: '♞',
  bP: '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface Piece {
  id: string;
  type: string; // e.g., 'wK', 'bP'
  square: string | null; // null if being dragged or off board
  x?: number;
  y?: number;
}

interface CustomBoardProps {
  fen: string;
  onBoardChange: (fen: string) => void;
  orientation: 'white' | 'black';
  suggestedMove?: { from: string; to: string } | null;
}

export function CustomBoard({ fen, onBoardChange, orientation, suggestedMove }: CustomBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [boardSize, setBoardSize] = useState(480);

  // Parse FEN to pieces
  useEffect(() => {
    const fenParts = fen.split(' ');
    const position = fenParts[0];
    const newPieces: Piece[] = [];
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
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = `${color}${char.toUpperCase()}`;
        newPieces.push({ id: `${id++}`, type, square: sq });
        square++;
      }
    }

    setPieces(newPieces);
  }, [fen]);

  // Update board size on mount/resize
  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        const size = Math.min(boardRef.current.offsetWidth, window.innerHeight - 200);
        setBoardSize(Math.max(320, size));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const squareSize = boardSize / 8;

  const getSquareCoords = (square: string): { x: number; y: number } => {
    const file = FILES.indexOf(square[0]);
    const rank = RANKS.indexOf(square[1]);
    return {
      x: file * squareSize,
      y: rank * squareSize,
    };
  };

  const getCoordsToSquare = (x: number, y: number): string | null => {
    const file = Math.floor(x / squareSize);
    const rank = Math.floor(y / squareSize);
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      return FILES[file] + RANKS[rank];
    }
    return null;
  };

  const handleMouseDown = (piece: Piece, e: React.MouseEvent) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDraggedPiece(piece);
    setDragOffset({
      x: e.clientX - rect.left - (piece.x || 0),
      y: e.clientY - rect.top - (piece.y || 0),
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedPiece || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Update all pieces
    setPieces((prev) => prev.map((p) => (p.id === draggedPiece.id ? { ...p, x, y } : p)));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!draggedPiece || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Check if piece is within board
    const newSquare = getCoordsToSquare(x + squareSize / 2, y + squareSize / 2);

    if (newSquare) {
      // Piece dropped on board
      setPieces((prev) =>
        prev.map((p) =>
          p.id === draggedPiece.id ? { ...p, square: newSquare, x: undefined, y: undefined } : p
        )
      );
    } else {
      // Piece dropped outside board - remove it
      setPieces((prev) => prev.filter((p) => p.id !== draggedPiece.id));
    }

    setDraggedPiece(null);

    // Convert pieces to FEN and update
    const newFen = piecesToFen(pieces.filter((p) => p.id !== draggedPiece.id && newSquare));
    onBoardChange(newFen);
  };

  const piecesToFen = (pcs: Piece[]): string => {
    let fen = '';
    for (let rank = 0; rank < 8; rank++) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const square = FILES[file] + RANKS[rank];
        const piece = pcs.find((p) => p.square === square);
        if (piece) {
          if (empty > 0) fen += empty;
          empty = 0;
          fen +=
            piece.type[1] === piece.type[1].toUpperCase()
              ? piece.type[1]
              : piece.type[1].toLowerCase();
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (rank < 7) fen += '/';
    }
    return fen + ' w - - 0 1';
  };

  const addPiece = (type: string) => {
    const newId = Math.random().toString();
    const newPiece: Piece = { id: newId, type, square: null, x: 100, y: 100 };
    setPieces([...pieces, newPiece]);
  };

  const isLightSquare = (file: number, rank: number) => (file + rank) % 2 === 0;

  const orientationClass = orientation === 'black' ? 'scale-x-[-1] scale-y-[-1]' : '';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Draggable Piece Palette - Top (White pieces) */}
      <div className="flex gap-2 flex-wrap justify-center bg-white rounded-lg shadow p-4 w-full">
        <p className="w-full text-center text-sm font-semibold text-slate-700 mb-2">
          Drag pieces below onto board
        </p>
        {['wP', 'wN', 'wB', 'wR', 'wQ', 'wK'].map((type) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer!.effectAllowed = 'move';
              e.dataTransfer!.setData('piece', type);
            }}
            className="text-4xl cursor-move hover:opacity-75 transition select-none"
            title={type}
          >
            {PIECE_SYMBOLS[type]}
          </div>
        ))}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className={`relative bg-amber-100 rounded-lg shadow-2xl cursor-move ${orientationClass}`}
        style={{
          width: `${boardSize}px`,
          height: `${boardSize}px`,
          aspectRatio: '1 / 1',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!boardRef.current) return;
          const type = e.dataTransfer.getData('piece');
          if (!type) return;

          const rect = boardRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const square = getCoordsToSquare(x, y);

          if (square) {
            const newId = Math.random().toString();
            const newPiece: Piece = { id: newId, type, square };
            const newPcs = [...pieces, newPiece];
            setPieces(newPcs);
            onBoardChange(piecesToFen(newPcs));
          }
        }}
      >
        {/* Board squares */}
        {RANKS.map((rank, rankIdx) =>
          FILES.map((file, fileIdx) => {
            const square = file + rank;
            const isLight = isLightSquare(fileIdx, rankIdx);
            const isSuggested =
              suggestedMove && (suggestedMove.from === square || suggestedMove.to === square);
            const isSuggestedArrow = suggestedMove && suggestedMove.from === square;

            return (
              <div
                key={square}
                className={`absolute transition ${isLight ? 'bg-amber-100' : 'bg-amber-700'} ${
                  isSuggested ? 'ring-4 ring-yellow-400 ring-inset' : ''
                }`}
                style={{
                  left: `${fileIdx * squareSize}px`,
                  top: `${rankIdx * squareSize}px`,
                  width: `${squareSize}px`,
                  height: `${squareSize}px`,
                }}
              >
                {isSuggestedArrow && suggestedMove && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      opacity: 0.3,
                    }}
                  >
                    <div className="text-yellow-400 font-bold">→</div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Rank labels (outside - left side) */}
        {RANKS.map((rank, idx) => (
          <div
            key={`rank-${rank}`}
            className="absolute -left-8 font-bold text-slate-700 select-none"
            style={{
              top: `${idx * squareSize + squareSize / 2 - 8}px`,
              lineHeight: '1',
            }}
          >
            {rank}
          </div>
        ))}

        {/* File labels (outside - bottom) */}
        {FILES.map((file, idx) => (
          <div
            key={`file-${file}`}
            className="absolute -bottom-8 font-bold text-slate-700 select-none"
            style={{
              left: `${idx * squareSize + squareSize / 2 - 8}px`,
              lineHeight: '1',
            }}
          >
            {file}
          </div>
        ))}

        {/* Pieces */}
        {pieces.map((piece) => {
          if (!piece.square && piece.x === undefined) return null; // Skip pieces not placed

          let posX = 0;
          let posY = 0;

          if (piece.square) {
            const coords = getSquareCoords(piece.square);
            posX = coords.x;
            posY = coords.y;
          } else {
            posX = piece.x || 0;
            posY = piece.y || 0;
          }

          const isDragging = draggedPiece?.id === piece.id;

          return (
            <div
              key={piece.id}
              className={`absolute cursor-grab active:cursor-grabbing transition ${isDragging ? 'z-50 opacity-75' : 'z-10'}`}
              style={{
                left: `${posX}px`,
                top: `${posY}px`,
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${squareSize * 0.8}px`,
                lineHeight: '1',
                userSelect: 'none',
              }}
              onMouseDown={(e) => handleMouseDown(piece, e)}
            >
              {PIECE_SYMBOLS[piece.type]}
            </div>
          );
        })}
      </div>

      {/* Draggable Piece Palette - Bottom (Black pieces) */}
      <div className="flex gap-2 flex-wrap justify-center bg-white rounded-lg shadow p-4 w-full">
        <p className="w-full text-center text-sm font-semibold text-slate-700 mb-2">Black pieces</p>
        {['bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].map((type) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer!.effectAllowed = 'move';
              e.dataTransfer!.setData('piece', type);
            }}
            className="text-4xl cursor-move hover:opacity-75 transition select-none"
            title={type}
          >
            {PIECE_SYMBOLS[type]}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-xs text-slate-500 text-center">
        Drag pieces from palettes or drag existing pieces on board • Drag off board to remove
      </div>
    </div>
  );
}
