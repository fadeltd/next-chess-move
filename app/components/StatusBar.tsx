'use client';

import { Chess } from 'chess.js';

interface StatusBarProps {
  game: Chess;
  compact?: boolean;
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function calculateMaterial(board: ReturnType<Chess['board']>, color: 'w' | 'b') {
  let score = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.color === color) {
        score += pieceValues[piece.type] || 0;
      }
    }
  }
  return score;
}

export function StatusBar({ game, compact = false }: StatusBarProps) {
  const board = game.board();
  const whiteMaterial = calculateMaterial(board, 'w');
  const blackMaterial = calculateMaterial(board, 'b');
  const difference = whiteMaterial - blackMaterial;

  if (compact) {
    return (
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-700">
          {difference === 0 ? (
            <span className="text-slate-600">Material: Equal</span>
          ) : (
            <span className="font-semibold">
              {difference > 0 ? '♔ +' : '♚ +'}
              {Math.abs(difference)}
            </span>
          )}
        </div>
        <div className="text-slate-500 text-right">
          W: {whiteMaterial} | B: {blackMaterial}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Material Score</h3>
          <div className="text-2xl font-bold">
            {difference === 0 ? (
              <span className="text-slate-600">Equal</span>
            ) : (
              <span className={difference > 0 ? 'text-white' : 'text-slate-900'}>
                {difference > 0 ? '♔ +' : '♚ +'}
                {Math.abs(difference)}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 text-right">
          <div>White: {whiteMaterial} pts</div>
          <div>Black: {blackMaterial} pts</div>
        </div>
      </div>
    </div>
  );
}
