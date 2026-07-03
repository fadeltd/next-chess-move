'use client';

import { useState } from 'react';

interface PieceSelectorProps {
  onPlacePiece: (piece: string, square: string) => void;
}

const PIECES = [
  { id: 'wK', label: '♔', name: 'White King', piece: 'wK' },
  { id: 'wQ', label: '♕', name: 'White Queen', piece: 'wQ' },
  { id: 'wR', label: '♖', name: 'White Rook', piece: 'wR' },
  { id: 'wB', label: '♗', name: 'White Bishop', piece: 'wB' },
  { id: 'wN', label: '♘', name: 'White Knight', piece: 'wN' },
  { id: 'wP', label: '♙', name: 'White Pawn', piece: 'wP' },
  { id: 'bK', label: '♚', name: 'Black King', piece: 'bK' },
  { id: 'bQ', label: '♛', name: 'Black Queen', piece: 'bQ' },
  { id: 'bR', label: '♜', name: 'Black Rook', piece: 'bR' },
  { id: 'bB', label: '♝', name: 'Black Bishop', piece: 'bB' },
  { id: 'bN', label: '♞', name: 'Black Knight', piece: 'bN' },
  { id: 'bP', label: '♟', name: 'Black Pawn', piece: 'bP' },
];

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function PieceSelector({ onPlacePiece }: PieceSelectorProps) {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  const handleBoardClick = (file: string, rank: string) => {
    if (selectedPiece) {
      const square = file + rank;
      onPlacePiece(selectedPiece, square);
      setSelectedPiece(null);
      setShowBoard(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4 text-slate-800">Add Pieces</h2>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {PIECES.map((piece) => (
          <button
            key={piece.id}
            onClick={() => {
              setSelectedPiece(selectedPiece === piece.piece ? null : piece.piece);
              setShowBoard(true);
            }}
            className={`p-2 rounded text-2xl transition font-bold ${
              selectedPiece === piece.piece
                ? 'bg-blue-500 text-white ring-2 ring-blue-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}
            title={piece.name}
          >
            {piece.label}
          </button>
        ))}
      </div>

      {selectedPiece && showBoard && (
        <div>
          <p className="text-sm text-slate-600 mb-3">Click a square to place piece</p>
          <div className="bg-slate-800 p-1 rounded inline-block">
            <div className="grid gap-0" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
              {RANKS.map((rank) =>
                FILES.map((file) => (
                  <button
                    key={`${file}${rank}`}
                    onClick={() => handleBoardClick(file, rank)}
                    className={`w-8 h-8 border border-slate-600 transition hover:opacity-75 ${
                      (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                        ? 'bg-amber-100'
                        : 'bg-amber-700'
                    }`}
                    title={`${file}${rank}`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPiece && !showBoard && (
        <button
          onClick={() => setShowBoard(true)}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium text-sm"
        >
          Click to place piece
        </button>
      )}
    </div>
  );
}
