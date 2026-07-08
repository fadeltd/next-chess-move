'use client';

import { useRef, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { CanvasBoard } from './CanvasBoard';
import { StatusBar } from './StatusBar';
import { BoardControls, AnalysisControls } from './Controls';
import { useStockfish } from '@/lib/useStockfish';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface ChessMove {
  from: string;
  to: string;
  piece: string;
  color: 'w' | 'b';
  flags: string;
  san: string;
  captured?: string;
  promotion?: string;
}

export function ChessApp() {
  const [currentFen, setCurrentFen] = useState<string>(START_FEN);
  const [fenHistory, setFenHistory] = useState<string[]>([START_FEN]);
  const [moveHistory, setMoveHistory] = useState<string[]>([START_FEN]); // For undo/redo
  const [moveHistoryIndex, setMoveHistoryIndex] = useState(0); // Current position in history
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [playerToMove, setPlayerToMove] = useState<'w' | 'b'>('w');
  const [suggestedMove, setSuggestedMove] = useState<string | null>(null);
  const [suggestedFrom, setSuggestedFrom] = useState<string | null>(null);
  const [suggestedTo, setSuggestedTo] = useState<string | null>(null);
  const [suggestedArrows, setSuggestedArrows] = useState<Array<[string, string, string]>>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [castlingRights, setCastlingRights] = useState({ wK: true, wQ: true, bK: true, bQ: true });
  const [analysisStats, setAnalysisStats] = useState<{
    depth: number;
    nps: number;
    time: number;
    score: number;
    isMate?: boolean;
  } | null>(null);
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
    text: string;
    depth?: number;
    nps?: number;
    time?: number;
    score?: number;
    isMate?: boolean;
  } | null>(null);
  const [avoidedDrawCount, setAvoidedDrawCount] = useState(0);

  const { isReady: stockfishReady, getBestMove } = useStockfish();

  // Track previous FEN to detect piece movements
  const prevFenRef = useRef<string>(START_FEN);

  // Parse FEN and options from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Parse FEN
    const fenParam = params.get('fen');
    if (fenParam) {
      setCurrentFen(fenParam);
      // Initialize move history with the loaded FEN so undo works properly
      setMoveHistory([fenParam]);
      setMoveHistoryIndex(0);
      prevFenRef.current = fenParam;

      const castling = fenParam.split(' ')[2] || '-';
      setCastlingRights({
        wK: castling.includes('K'),
        wQ: castling.includes('Q'),
        bK: castling.includes('k'),
        bQ: castling.includes('q'),
      });
    }

    // Parse board orientation (flip)
    if (params.has('f') || params.get('flip') === 'true') {
      setOrientation('black');
    }

    // Parse player to move
    if (params.has('b') || params.get('player') === 'b') {
      setPlayerToMove('b');
    } else if (params.has('w') || params.get('player') === 'w') {
      setPlayerToMove('w');
    }
  }, []);

  // Update URL whenever FEN, orientation, or player to move changes
  useEffect(() => {
    const urlParts: string[] = [];

    // Add flip parameter if board is flipped
    if (orientation === 'black') {
      urlParts.push('f');
    }

    // Add player to move parameter if black
    if (playerToMove === 'b') {
      urlParts.push('b');
    }

    // Build query string
    const query =
      urlParts.length > 0
        ? urlParts.join('&') + `&fen=${encodeURIComponent(currentFen)}`
        : `fen=${encodeURIComponent(currentFen)}`;
    const newUrl = `${window.location.origin}${window.location.pathname}?${query}`;
    window.history.replaceState({ fen: currentFen, orientation, playerToMove }, '', newUrl);
  }, [currentFen, orientation, playerToMove]);

  // Clear suggested move when player changes
  useEffect(() => {
    setSuggestedMove(null);
    setSuggestedFrom(null);
    setSuggestedTo(null);
    setSuggestedArrows([]);
    setLastMove(null);
    setAnalysisStats(null);
  }, [playerToMove]);

  // Auto-disable castling rights when king or rooks move (but not when undoing)
  useEffect(() => {
    if (currentFen === prevFenRef.current) return;

    // Skip auto-disable if we're undoing/redoing (not at end of history)
    if (moveHistoryIndex < moveHistory.length - 1) {
      prevFenRef.current = currentFen;
      return;
    }

    const getPiecePosition = (fen: string, piece: string): string | null => {
      const boardPart = fen.split(' ')[0];
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

      let squareIndex = 0;
      for (const char of boardPart) {
        if (char === '/') continue;
        if (!isNaN(Number(char))) {
          squareIndex += Number(char);
        } else {
          const file = files[squareIndex % 8];
          const rank = ranks[Math.floor(squareIndex / 8)];
          if (char === piece) {
            return file + rank;
          }
          squareIndex++;
        }
      }
      return null;
    };

    const prevKingPos = getPiecePosition(prevFenRef.current, 'K');
    const currKingPos = getPiecePosition(currentFen, 'K');
    const prevBlackKingPos = getPiecePosition(prevFenRef.current, 'k');
    const currBlackKingPos = getPiecePosition(currentFen, 'k');

    // Check if white king moved
    if (prevKingPos && currKingPos && prevKingPos !== currKingPos) {
      setCastlingRights((prev) => ({ ...prev, wK: false, wQ: false }));
    }

    // Check if black king moved
    if (prevBlackKingPos && currBlackKingPos && prevBlackKingPos !== currBlackKingPos) {
      setCastlingRights((prev) => ({ ...prev, bK: false, bQ: false }));
    }

    // Check if white h-rook moved (kingside)
    const prevWhiteHRook = getPiecePosition(prevFenRef.current, 'R');
    const currWhiteHRook = getPiecePosition(currentFen, 'R');
    if (prevWhiteHRook === 'h1' && currWhiteHRook !== 'h1') {
      setCastlingRights((prev) => ({ ...prev, wK: false }));
    }

    // Check if white a-rook moved (queenside)
    // This is trickier since there are 2 rooks - we check if any rook left a1
    const prevFenRanks = prevFenRef.current.split(' ')[0].split('/');
    const currFenRanks = currentFen.split(' ')[0].split('/');
    if (
      prevFenRanks[7] &&
      currFenRanks[7] &&
      prevFenRanks[7][0] === 'R' &&
      currFenRanks[7][0] !== 'R'
    ) {
      setCastlingRights((prev) => ({ ...prev, wQ: false }));
    }

    // Check if black h-rook moved (kingside)
    const prevBlackHRook = getPiecePosition(prevFenRef.current, 'r');
    const currBlackHRook = getPiecePosition(currentFen, 'r');
    if (prevBlackHRook === 'h8' && currBlackHRook !== 'h8') {
      setCastlingRights((prev) => ({ ...prev, bK: false }));
    }

    // Check if black a-rook moved (queenside)
    if (
      prevFenRanks[0] &&
      currFenRanks[0] &&
      prevFenRanks[0][0] === 'r' &&
      currFenRanks[0][0] !== 'r'
    ) {
      setCastlingRights((prev) => ({ ...prev, bQ: false }));
    }

    prevFenRef.current = currentFen;
  }, [currentFen]);

  // Track move history for undo/redo
  useEffect(() => {
    // Only update moveHistory if currentFen changed due to a new move
    // (not from undo/redo which directly sets currentFen)
    if (moveHistoryIndex === moveHistory.length - 1) {
      // We're at the end of history, add new move
      if (currentFen !== moveHistory[moveHistoryIndex]) {
        const newHistory = moveHistory.slice(0, moveHistoryIndex + 1);
        newHistory.push(currentFen);
        setMoveHistory(newHistory);
        setMoveHistoryIndex(newHistory.length - 1);
      }
    }
  }, [currentFen, moveHistoryIndex, moveHistory]);

  const game = new Chess();
  game.load(currentFen, { skipValidation: true });

  const canCalculate = stockfishReady && game.moves().length > 0;

  // Check if a move would cause threefold repetition
  const wouldCauseRepetition = (fromSquare: string, toSquare: string): boolean => {
    const tempGame = new Chess();
    const parts = currentFen.split(' ');
    const fenToApply =
      parts[0] +
      ' ' +
      playerToMove +
      ' ' +
      (parts[2] || 'KQkq') +
      ' ' +
      (parts[3] || '-') +
      ' ' +
      (parts[4] || '0') +
      ' ' +
      (parts[5] || '1');
    tempGame.load(fenToApply, { skipValidation: true });

    const move = tempGame.move({
      from: fromSquare,
      to: toSquare,
      promotion: 'q',
    });

    if (!move) return false;

    const resultingFen = tempGame.fen().split(' ')[0]; // Just the board position, ignore move counters

    // Count occurrences of this position in history
    const occurrences = fenHistory.filter((fen) => fen.split(' ')[0] === resultingFen).length;

    // If this position already appeared twice, applying this move would cause threefold repetition
    return occurrences >= 2;
  };

  const handleReset = () => {
    setCurrentFen(START_FEN);
    setFenHistory([START_FEN]);
    setMoveHistory([START_FEN]);
    setMoveHistoryIndex(0);
    setSuggestedMove(null);
    setSuggestedFrom(null);
    setSuggestedTo(null);
    setSuggestedArrows([]);
    setLastMove(null);
    setAnalysisStats(null);
    setPlayerToMove('w');
    setAvoidedDrawCount(0);
    setCastlingRights({ wK: true, wQ: true, bK: true, bQ: true });
  };

  const handleUndo = () => {
    // Only undo if there are previous moves
    if (moveHistoryIndex <= 0) {
      return; // Already at start, do nothing
    }

    const newIndex = moveHistoryIndex - 1;
    setMoveHistoryIndex(newIndex);
    const fenToRestore = moveHistory[newIndex];
    setCurrentFen(fenToRestore);

    // Restore castling rights from FEN
    const castling = fenToRestore.split(' ')[2] || '-';
    setCastlingRights({
      wK: castling.includes('K'),
      wQ: castling.includes('Q'),
      bK: castling.includes('k'),
      bQ: castling.includes('q'),
    });

    setSuggestedMove(null);
    setSuggestedFrom(null);
    setSuggestedTo(null);
    setSuggestedArrows([]);
    setLastMove(null);
    setAnalysisStats(null);
  };

  const handleRedo = () => {
    // Only redo if there are moves ahead
    if (moveHistoryIndex >= moveHistory.length - 1) {
      return; // Already at end, do nothing
    }

    const newIndex = moveHistoryIndex + 1;
    setMoveHistoryIndex(newIndex);
    const fenToRestore = moveHistory[newIndex];
    setCurrentFen(fenToRestore);

    // Restore castling rights from FEN
    const castling = fenToRestore.split(' ')[2] || '-';
    setCastlingRights({
      wK: castling.includes('K'),
      wQ: castling.includes('Q'),
      bK: castling.includes('k'),
      bQ: castling.includes('q'),
    });

    setSuggestedMove(null);
    setSuggestedFrom(null);
    setSuggestedTo(null);
    setSuggestedArrows([]);
    setLastMove(null);
    setAnalysisStats(null);
  };

  const handleCaptureAll = () => {
    // Keep only kings in their current positions
    const parts = currentFen.split(' ');
    const position = parts[0];

    // Find current king positions
    const newPieces: string[] = [];
    let square = 0;
    for (const char of position) {
      if (char === '/') {
        newPieces.push('/');
        continue;
      }
      if (!isNaN(Number(char))) {
        for (let i = 0; i < Number(char); i++) {
          newPieces.push('.');
        }
      } else if (char.toUpperCase() === 'K') {
        newPieces.push(char);
      } else {
        newPieces.push('.');
      }
    }

    // Rebuild FEN
    let newFen = '';
    let emptyCount = 0;
    for (let i = 0; i < newPieces.length; i++) {
      const piece = newPieces[i];
      if (piece === '/') {
        if (emptyCount > 0) newFen += emptyCount;
        emptyCount = 0;
        newFen += '/';
      } else if (piece === '.') {
        emptyCount++;
      } else {
        if (emptyCount > 0) newFen += emptyCount;
        emptyCount = 0;
        newFen += piece;
      }
    }
    if (emptyCount > 0) newFen += emptyCount;

    const newBoardFen = newFen + ' ' + playerToMove + ' - - 0 1';
    setCurrentFen(newBoardFen);
    setFenHistory([newBoardFen]);
    setSuggestedMove(null);
    setSuggestedArrows([]);
  };

  const handleFlip = () => {
    setOrientation(orientation === 'white' ? 'black' : 'white');
    // Don't change FEN - pieces stay on the same tiles
    // Only the perspective/labels change
  };

  const flipCastlingRights = (castling: string) => {
    if (castling === '-') return '-';
    let flipped = '';
    if (castling.includes('K')) flipped += 'q';
    if (castling.includes('Q')) flipped += 'k';
    if (castling.includes('k')) flipped += 'Q';
    if (castling.includes('q')) flipped += 'K';
    return flipped || '-';
  };

  const getCastlingString = (rights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean }) => {
    let castling = '';
    if (rights.wK) castling += 'K';
    if (rights.wQ) castling += 'Q';
    if (rights.bK) castling += 'k';
    if (rights.bQ) castling += 'q';
    return castling || '-';
  };

  const handleCalculateMove = async () => {
    setIsThinking(true);
    setSuggestedMove(null);
    setSuggestedFrom(null);
    setSuggestedTo(null);
    setSuggestedArrows([]);
    setAnalysisStats(null);

    try {
      // When analyzing, construct FEN with correct player to move
      const parts = currentFen.split(' ');
      let fenForAnalysis =
        parts[0] +
        ' ' +
        playerToMove +
        ' ' +
        (parts[2] || 'KQkq') +
        ' ' +
        (parts[3] || '-') +
        ' ' +
        (parts[4] || '0') +
        ' ' +
        (parts[5] || '1');

      const result = await getBestMove(fenForAnalysis, (stats) => {
        setAnalysisStats(stats);
      });

      // Skip if no legal move
      if (!result.from || !result.to) {
        setLastMove({ from: '', to: '', text: result.text });
        return;
      }

      // Check if this move would cause repetition (draw avoidance)
      if (wouldCauseRepetition(result.from, result.to)) {
        setAvoidedDrawCount((prev) => prev + 1);

        // Find an alternative move that doesn't cause repetition
        const tempGame = new Chess();
        tempGame.load(fenForAnalysis, { skipValidation: true });
        const legalMoves: ChessMove[] = tempGame.moves({ verbose: true }) as ChessMove[];

        // Prioritize captures and checks, avoid repetitions
        const goodMoves = legalMoves
          .sort((a, b) => {
            const aCaptures = a.captured ? -1 : 0;
            const bCaptures = b.captured ? -1 : 0;
            const aCheck = a.flags.includes('c') ? -1 : 0;
            const bCheck = b.flags.includes('c') ? -1 : 0;
            return aCaptures + aCheck - bCaptures - bCheck;
          })
          .filter((move) => !wouldCauseRepetition(move.from, move.to));

        if (goodMoves.length === 0) {
          // No non-drawing moves available, show the original
        } else {
          const altMove = goodMoves[0];

          const sanLower = altMove.san.toLowerCase();
          setSuggestedMove(sanLower);
          setSuggestedFrom(altMove.from);
          setSuggestedTo(altMove.to);
          setSuggestedArrows([[altMove.from, altMove.to, 'rgb(34, 197, 94)']]);
          setLastMove({
            from: altMove.from,
            to: altMove.to,
            text: sanLower,
            depth: result.depth,
            nps: result.nps,
            time: result.time,
            score: result.score,
            isMate: result.isMate,
          });
          return;
        }
      }

      // Convert to SAN notation for display
      let sanLower = result.text.toLowerCase();
      if (result.from && result.to) {
        const moveGame = new Chess();
        moveGame.load(fenForAnalysis, { skipValidation: true });
        const moveObj: ChessMove | null = moveGame.move({
          from: result.from,
          to: result.to,
          promotion: result.promotion || 'q',
        }) as ChessMove | null;
        if (moveObj) {
          sanLower = moveObj.san.toLowerCase();
        }
      }

      setSuggestedMove(sanLower);
      setSuggestedFrom(result.from);
      setSuggestedTo(result.to);
      setSuggestedArrows([[result.from, result.to, 'rgb(255, 200, 0)']]);
      if (result.depth || result.nps || result.time) {
        setAnalysisStats({
          depth: result.depth || 0,
          nps: result.nps || 0,
          time: result.time || 0,
          score: result.score || 0,
          isMate: result.isMate,
        });
      }
      // Store last move with SAN notation (lowercase for display)
      setLastMove({ ...result, text: sanLower });
    } catch (error) {
      // Silently handle calculation errors
    } finally {
      setIsThinking(false);
    }
  };

  const handleApplyMove = () => {
    if (!suggestedFrom || !suggestedTo) return;

    try {
      const tempGame = new Chess();

      // Use the same FEN construction as handleCalculateMove to ensure player to move is correct
      const parts = currentFen.split(' ');
      const fenToApply =
        parts[0] +
        ' ' +
        playerToMove +
        ' ' +
        (parts[2] || 'KQkq') +
        ' ' +
        (parts[3] || '-') +
        ' ' +
        (parts[4] || '0') +
        ' ' +
        (parts[5] || '1');

      tempGame.load(fenToApply, { skipValidation: true });

      // Try without promotion first (for non-pawn moves)
      let move: ChessMove | null = tempGame.move({
        from: suggestedFrom,
        to: suggestedTo,
      });

      // If no move found and it's a pawn promotion, try with promotion
      if (!move) {
        move = tempGame.move({
          from: suggestedFrom,
          to: suggestedTo,
          promotion: 'q',
        });
      }

      if (!move) {
        return;
      }

      // Update castling rights based on piece movement
      let newCastlingRights = { ...castlingRights };

      if (move.flags.includes('k')) {
        // Kingside castling move
        if (move.color === 'w') {
          newCastlingRights.wK = false;
        } else {
          newCastlingRights.bK = false;
        }
      } else if (move.flags.includes('q')) {
        // Queenside castling move
        if (move.color === 'w') {
          newCastlingRights.wQ = false;
        } else {
          newCastlingRights.bQ = false;
        }
      } else {
        // Check if king moved (loses all castling rights)
        if (move.piece === 'k') {
          if (move.color === 'w') {
            newCastlingRights.wK = false;
            newCastlingRights.wQ = false;
          } else {
            newCastlingRights.bK = false;
            newCastlingRights.bQ = false;
          }
        }
        // Check if rook moved from starting position
        else if (move.piece === 'r') {
          // White rooks
          if (move.color === 'w') {
            if (suggestedFrom === 'a1') newCastlingRights.wQ = false;
            if (suggestedFrom === 'h1') newCastlingRights.wK = false;
          }
          // Black rooks
          else {
            if (suggestedFrom === 'a8') newCastlingRights.bQ = false;
            if (suggestedFrom === 'h8') newCastlingRights.bK = false;
          }
        }
      }

      // Update FEN with new castling rights if any changed
      let newFen: string;
      if (JSON.stringify(newCastlingRights) !== JSON.stringify(castlingRights)) {
        const parts = tempGame.fen().split(' ');
        const castlingStr = getCastlingString(newCastlingRights);
        newFen = `${parts[0]} ${parts[1]} ${castlingStr} ${parts[3] || '-'} ${parts[4] || '0'} ${parts[5] || '1'}`;
        setCastlingRights(newCastlingRights);
      } else {
        newFen = tempGame.fen();
      }

      setCurrentFen(newFen);
      setFenHistory([...fenHistory, newFen]);

      setSuggestedMove(null);
      setSuggestedFrom(null);
      setSuggestedTo(null);
      setSuggestedArrows([]);
      setLastMove(null);
      setAnalysisStats(null);
    } catch (error) {
      // Silently handle move application errors
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();

      // Handle Cmd+Z / Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Handle Cmd+Shift+Z / Ctrl+Shift+Z for redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 'z') {
        e.preventDefault();
        handleRedo();
        return;
      }

      switch (key) {
        case ' ':
          e.preventDefault();
          // Apply move if one is suggested, otherwise calculate
          if (suggestedMove && suggestedFrom && suggestedTo && !isThinking) {
            handleApplyMove();
          } else if (canCalculate && stockfishReady && !isThinking) {
            handleCalculateMove();
          }
          break;
        case 'f':
          e.preventDefault();
          handleFlip();
          break;
        case 'r':
          e.preventDefault();
          handleReset();
          break;
        case 'w':
          e.preventDefault();
          setPlayerToMove('w');
          break;
        case 'b':
          e.preventDefault();
          setPlayerToMove('b');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    canCalculate,
    stockfishReady,
    isThinking,
    handleCalculateMove,
    handleApplyMove,
    handleFlip,
    handleReset,
    handleCaptureAll,
    handleUndo,
    handleRedo,
    suggestedMove,
    suggestedFrom,
    suggestedTo,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="flex-shrink-0 p-2 md:p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
          Next Chess Move
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col xl:flex-row gap-2 p-2 lg:p-3">
        {/* Board Section */}
        <div className="flex flex-col gap-2 xl:flex-1 xl:min-w-0 flex-shrink-0 xl:min-h-0 max-h-[60vh] xl:max-h-none">
          {/* Material Score */}
          <div className="p-2 bg-white rounded shadow text-center flex-shrink-0">
            <StatusBar game={game} compact={true} />
          </div>

          {/* Board - Responsive sizing */}
          <div className="flex-1 w-full min-h-0 flex justify-center overflow-y-auto">
            <CanvasBoard
              fen={currentFen}
              onBoardChange={(newFen) => {
                setCurrentFen(newFen);
                setFenHistory([...fenHistory, newFen]);
                // Clear suggested move and analysis when user manually moves a piece
                setSuggestedMove(null);
                setSuggestedFrom(null);
                setSuggestedTo(null);
                setSuggestedArrows([]);
                setLastMove(null);
                setAnalysisStats(null);
              }}
              orientation={orientation}
              suggestedMove={
                suggestedArrows.length > 0
                  ? { from: suggestedArrows[0][0], to: suggestedArrows[0][1] }
                  : null
              }
            />
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full xl:w-64 flex-1 xl:flex-none flex flex-col gap-2 overflow-y-auto xl:overflow-y-auto">
          {/* Analysis Controls */}
          <AnalysisControls
            playerToMove={playerToMove}
            onPlayerChange={(player) => {
              setPlayerToMove(player);
              setSuggestedMove(null);
              setSuggestedFrom(null);
              setSuggestedTo(null);
              setSuggestedArrows([]);
              setLastMove(null);
              setAnalysisStats(null);
            }}
            onCalculateMove={handleCalculateMove}
            canCalculate={canCalculate}
            isThinking={isThinking}
            suggestedMove={suggestedMove}
            suggestedFrom={suggestedFrom}
            suggestedTo={suggestedTo}
            onApplyMove={handleApplyMove}
            stockfishReady={stockfishReady}
            analysisStats={analysisStats}
            lastMove={lastMove}
            isCheckmate={game.isCheckmate()}
            castlingRights={castlingRights}
            onCastlingChange={(rights) => {
              setCastlingRights(rights);
              // Update FEN with new castling rights
              const parts = currentFen.split(' ');
              const castlingStr = getCastlingString(rights);
              const newFen = `${parts[0]} ${parts[1]} ${castlingStr} ${parts[3] || '-'} ${parts[4] || '0'} ${parts[5] || '1'}`;
              setCurrentFen(newFen);
            }}
            avoidedDrawCount={avoidedDrawCount}
          />

          {/* Board Controls */}
          <BoardControls
            onReset={handleReset}
            onCaptureAll={handleCaptureAll}
            onFlip={handleFlip}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={moveHistoryIndex > 0}
            canRedo={moveHistoryIndex < moveHistory.length - 1}
            fen={currentFen}
          />
        </div>
      </div>
    </div>
  );
}
