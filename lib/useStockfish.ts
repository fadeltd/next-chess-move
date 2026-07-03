'use client';

import { useEffect, useRef, useState } from 'react';

interface BestMoveResult {
  from: string;
  to: string;
  promotion?: string;
  text: string;
  depth?: number;
  nps?: number;
  time?: number;
  score?: number;
  isMate?: boolean;
}

interface AnalysisStats {
  depth: number;
  nps: number;
  time: number;
  score: number;
  isMate?: boolean;
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const bestMovePromiseRef = useRef<{
    resolve: (value: BestMoveResult) => void;
    reject: (reason?: any) => void;
  } | null>(null);
  const statsCallbackRef = useRef<((stats: AnalysisStats) => void) | null>(null);
  const lastStatsRef = useRef<AnalysisStats>({ depth: 0, nps: 0, time: 0, score: 0 });

  useEffect(() => {
    const initWorker = async () => {
      try {
        workerRef.current = new Worker('/stockfish/stockfish.js');

        workerRef.current.onmessage = (event: MessageEvent<string>) => {
          const message = event.data;

          if (message === 'uciok') {
            workerRef.current?.postMessage('isready');
          }

          if (message === 'readyok') {
            setIsReady(true);
          }

          // Parse info line: "info depth 20 seldepth 25 multipv 1 score cp 35 nodes 1234567 nps 123456 time 10000 pv e2e4"
          if (message.startsWith('info') && bestMovePromiseRef.current) {
            const parts = message.split(' ');
            const stats: Partial<AnalysisStats> = {};

            for (let i = 0; i < parts.length; i++) {
              if (parts[i] === 'depth' && parts[i + 1]) {
                stats.depth = parseInt(parts[i + 1]);
              } else if (parts[i] === 'nps' && parts[i + 1]) {
                stats.nps = parseInt(parts[i + 1]);
              } else if (parts[i] === 'time' && parts[i + 1]) {
                stats.time = parseInt(parts[i + 1]);
              } else if (parts[i] === 'score' && parts[i + 1]) {
                if (parts[i + 1] === 'cp' && parts[i + 2]) {
                  stats.score = parseInt(parts[i + 2]);
                  stats.isMate = false;
                } else if (parts[i + 1] === 'mate' && parts[i + 2]) {
                  stats.score = parseInt(parts[i + 2]); // Mate in N moves
                  stats.isMate = true;
                }
              }
            }

            if (Object.keys(stats).length > 0) {
              lastStatsRef.current = { ...lastStatsRef.current, ...stats } as AnalysisStats;
              statsCallbackRef.current?.(lastStatsRef.current);
            }
          }

          // Parse bestmove message: "bestmove e2e4" or "bestmove e2e4q" (promotion) or "bestmove (none)"
          if (message.startsWith('bestmove')) {
            const parts = message.split(' ');
            if (parts.length > 1 && bestMovePromiseRef.current) {
              const moveStr = parts[1];

              // Handle no move (checkmate, stalemate, or draw)
              if (moveStr === '(none)') {
                console.log('Stockfish: no legal moves (checkmate/stalemate)');
                bestMovePromiseRef.current.resolve({
                  from: '',
                  to: '',
                  text: 'No legal moves',
                  depth: lastStatsRef.current.depth,
                  nps: lastStatsRef.current.nps,
                  time: lastStatsRef.current.time,
                  score: lastStatsRef.current.score,
                  isMate: lastStatsRef.current.isMate,
                });
                bestMovePromiseRef.current = null;
                lastStatsRef.current = { depth: 0, nps: 0, time: 0, score: 0 };
                return;
              }

              const from = moveStr.slice(0, 2);
              const to = moveStr.slice(2, 4);
              const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
              const text = `${from.toUpperCase()} → ${to.toUpperCase()}`;

              console.log('Stockfish returned move:', from + to, '→', text);

              bestMovePromiseRef.current.resolve({
                from,
                to,
                promotion,
                text,
                depth: lastStatsRef.current.depth,
                nps: lastStatsRef.current.nps,
                time: lastStatsRef.current.time,
                score: lastStatsRef.current.score,
                isMate: lastStatsRef.current.isMate,
              });
              bestMovePromiseRef.current = null;
              lastStatsRef.current = { depth: 0, nps: 0, time: 0, score: 0 };
            }
          }
        };

        workerRef.current.postMessage('uci');
      } catch (error) {
        console.error('Failed to initialize Stockfish worker:', error);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const getBestMove = (fen: string, onStats?: (stats: AnalysisStats) => void): Promise<BestMoveResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Stockfish worker not initialized'));
        return;
      }

      statsCallbackRef.current = onStats || null;
      lastStatsRef.current = { depth: 0, nps: 0, time: 0, score: 0 };
      bestMovePromiseRef.current = { resolve, reject };

      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage('go movetime 1000');
    });
  };

  return { isReady, getBestMove };
}
