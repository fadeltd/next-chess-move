'use client';

import { useState, useEffect } from 'react';

interface BoardControlsProps {
  onReset: () => void;
  onCaptureAll: () => void;
  onFlip: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  fen: string;
}

export function BoardControls({
  onReset,
  onCaptureAll,
  onFlip,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  fen,
}: BoardControlsProps) {
  const [fenUrl, setFenUrl] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?fen=${encodeURIComponent(fen)}`;
    setFenUrl(url);
  }, [fen]);

  const copyFen = () => {
    navigator.clipboard.writeText(fenUrl);
    alert('FEN URL copied to clipboard!');
  };

  const copyFenText = () => {
    navigator.clipboard.writeText(fen);
    alert('FEN text copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between font-semibold text-slate-800 hover:text-slate-600 transition"
      >
        <h2 className="text-base">Board Controls</h2>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {!isExpanded && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition cursor-pointer"
            title="Reset board (R)"
          >
            Reset (R)
          </button>
          <button
            onClick={onFlip}
            className="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600 transition cursor-pointer"
            title="Flip board (F)"
          >
            Flip (F)
          </button>
        </div>
      )}

      {isExpanded && (
        <>
          <div className="grid grid-cols-4 gap-1 mb-4">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="px-1 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:bg-slate-300 transition cursor-pointer"
              title="Undo move (Cmd+Z)"
            >
              ↶
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="px-1 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:bg-slate-300 transition cursor-pointer"
              title="Redo move (Cmd+Shift+Z)"
            >
              ↷
            </button>
            <button
              onClick={onCaptureAll}
              className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 transition cursor-pointer"
              title="Remove all pieces except kings"
            >
              Clear
            </button>
            <button
              onClick={onFlip}
              className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600 transition cursor-pointer"
              title="Flip board (F)"
            >
              Flip (F)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1 mb-4">
            <button
              onClick={onReset}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition cursor-pointer"
              title="Reset board (R)"
            >
              Reset (R)
            </button>
          </div>

          {/* FEN Display */}
          <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">FEN:</p>
            <p className="text-xs text-slate-600 break-all font-mono mb-2">{fen}</p>
            <button
              onClick={copyFenText}
              className="w-full px-3 py-1 bg-slate-300 text-slate-800 rounded font-medium hover:bg-slate-400 transition cursor-pointer text-xs mb-2"
            >
              Copy FEN
            </button>
          </div>

          {/* FEN URL */}
          {fenUrl && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Share Link:</p>
              <a
                href={fenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 break-all font-mono mb-2 block"
              >
                {fenUrl.length > 80 ? fenUrl.substring(0, 80) + '...' : fenUrl}
              </a>
              <button
                onClick={copyFen}
                className="w-full px-3 py-1 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition cursor-pointer text-xs"
              >
                Copy Link
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface AnalysisControlsProps {
  playerToMove: 'w' | 'b';
  onPlayerChange: (player: 'w' | 'b') => void;
  onCalculateMove: () => void;
  canCalculate: boolean;
  isThinking: boolean;
  suggestedMove: string | null;
  suggestedFrom?: string | null;
  suggestedTo?: string | null;
  onApplyMove?: () => void;
  stockfishReady: boolean;
  analysisStats?: {
    depth: number;
    nps: number;
    time: number;
    score: number;
    isMate?: boolean;
  } | null;
  lastMove?: {
    from: string;
    to: string;
    text: string;
    depth?: number;
    nps?: number;
    time?: number;
    score?: number;
    isMate?: boolean;
  } | null;
  isCheckmate?: boolean;
  castlingRights?: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  onCastlingChange?: (rights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean }) => void;
  avoidedDrawCount?: number;
}

export function AnalysisControls({
  playerToMove,
  onPlayerChange,
  onCalculateMove,
  canCalculate,
  isThinking,
  suggestedMove,
  suggestedFrom,
  suggestedTo,
  onApplyMove,
  stockfishReady,
  analysisStats,
  lastMove,
  isCheckmate,
  castlingRights,
  onCastlingChange,
  avoidedDrawCount,
}: AnalysisControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3">
      {/* Player selector */}
      <h3 className="text-xs font-semibold mb-2 text-slate-800">Move For</h3>
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => onPlayerChange('w')}
          className={`flex-1 px-2 py-1 rounded text-xs transition cursor-pointer ${
            playerToMove === 'w'
              ? 'bg-white text-slate-900 border-2 border-slate-900'
              : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200'
          }`}
          title="White to move (W)"
        >
          ♔ White (W)
        </button>
        <button
          onClick={() => onPlayerChange('b')}
          className={`flex-1 px-2 py-1 rounded text-xs transition cursor-pointer ${
            playerToMove === 'b'
              ? 'bg-slate-800 text-white border-2 border-slate-900'
              : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200'
          }`}
          title="Black to move (B)"
        >
          ♚ Black (B)
        </button>
      </div>

      {/* Castling Rights */}
      {castlingRights && onCastlingChange && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-800 mb-1">Castling</p>
          <div className="grid grid-cols-2 gap-1 mb-1">
            <button
              onClick={() => onCastlingChange({ ...castlingRights, wK: !castlingRights.wK })}
              disabled={!castlingRights.wK}
              className={`px-1 py-1 rounded text-xs transition cursor-pointer disabled:cursor-not-allowed ${
                castlingRights.wK
                  ? 'bg-white text-slate-900 border border-slate-900 hover:bg-slate-50'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={
                castlingRights.wK
                  ? 'White kingside castling available'
                  : 'White kingside castling unavailable (king or rook moved)'
              }
            >
              ♔ Kingside
            </button>
            <button
              onClick={() => onCastlingChange({ ...castlingRights, wQ: !castlingRights.wQ })}
              disabled={!castlingRights.wQ}
              className={`px-1 py-1 rounded text-xs transition cursor-pointer disabled:cursor-not-allowed ${
                castlingRights.wQ
                  ? 'bg-white text-slate-900 border border-slate-900 hover:bg-slate-50'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={
                castlingRights.wQ
                  ? 'White queenside castling available'
                  : 'White queenside castling unavailable (king or rook moved)'
              }
            >
              ♔ Queenside
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onCastlingChange({ ...castlingRights, bK: !castlingRights.bK })}
              disabled={!castlingRights.bK}
              className={`px-1 py-1 rounded text-xs transition cursor-pointer disabled:cursor-not-allowed ${
                castlingRights.bK
                  ? 'bg-slate-800 text-white border border-slate-900 hover:bg-slate-700'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={
                castlingRights.bK
                  ? 'Black kingside castling available'
                  : 'Black kingside castling unavailable (king or rook moved)'
              }
            >
              ♚ Kingside
            </button>
            <button
              onClick={() => onCastlingChange({ ...castlingRights, bQ: !castlingRights.bQ })}
              disabled={!castlingRights.bQ}
              className={`px-1 py-1 rounded text-xs transition cursor-pointer disabled:cursor-not-allowed ${
                castlingRights.bQ
                  ? 'bg-slate-800 text-white border border-slate-900 hover:bg-slate-700'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
              title={
                castlingRights.bQ
                  ? 'Black queenside castling available'
                  : 'Black queenside castling unavailable (king or rook moved)'
              }
            >
              ♚ Queenside
            </button>
          </div>
        </div>
      )}

      {/* Calculate button */}
      <button
        onClick={onCalculateMove}
        disabled={!canCalculate || !stockfishReady || isThinking}
        className="w-full px-3 py-1 bg-red-500 text-white rounded text-xs disabled:bg-slate-400 hover:bg-red-600 transition mb-2 cursor-pointer font-medium"
        title="Calculate next move (Space)"
      >
        {isThinking ? 'Thinking...' : 'Calculate (Space)'}
      </button>

      {/* Analysis Stats */}
      {analysisStats && (analysisStats.depth > 0 || analysisStats.nps > 0) && (
        <div className="mb-2 p-2 bg-slate-50 rounded border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-1">Analysis</p>
          <div className="text-xs text-slate-600 space-y-0">
            {analysisStats.depth > 0 && <p>D: {analysisStats.depth}</p>}
            {analysisStats.nps > 0 && <p>K: {(analysisStats.nps / 1000).toFixed(0)}</p>}
            {analysisStats.time > 0 && <p>T: {(analysisStats.time / 1000).toFixed(2)}s</p>}
            {analysisStats.isMate ? (
              <p className="font-semibold text-green-600">M{Math.abs(analysisStats.score)}</p>
            ) : analysisStats.score !== 0 ? (
              <p>{(analysisStats.score / 100).toFixed(2)}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Checkmate Status */}
      {isCheckmate && (
        <div className="mb-2 p-2 bg-red-50 rounded border border-red-300">
          <p className="text-xs font-semibold text-red-700">🏁 Mate!</p>
        </div>
      )}

      {/* Draw Avoidance Counter */}
      {avoidedDrawCount ? (
        <div className="mb-2 p-2 bg-purple-50 rounded border border-purple-200">
          <p className="text-xs font-semibold text-purple-700">🛡️ Avoids: {avoidedDrawCount}</p>
        </div>
      ) : null}

      {/* Last Move */}
      {lastMove && (
        <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs font-semibold text-slate-700">Last: {lastMove.text}</p>
          {lastMove.isMate ? (
            <p className="text-xs font-semibold text-green-600">M{Math.abs(lastMove.score || 0)}</p>
          ) : lastMove.score ? (
            <p className="text-xs text-slate-600">{(lastMove.score / 100).toFixed(2)}</p>
          ) : null}
        </div>
      )}

      {suggestedMove && suggestedFrom && suggestedTo && !isThinking && (
        <button
          onClick={onApplyMove}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition cursor-pointer font-medium mb-2"
          title="Apply suggested move (Space)"
        >
          Apply: {suggestedMove} (Space)
        </button>
      )}

      {!stockfishReady && <div className="text-center text-xs text-slate-500">Loading...</div>}
    </div>
  );
}
