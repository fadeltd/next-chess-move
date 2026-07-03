'use client';

interface MoveHistoryProps {
  moves: string[];
  cursor: number;
  onUndo: () => void;
  onRedo: () => void;
  onMoveClick: (moveIndex: number) => void;
}

export function MoveHistory({ moves, cursor, onUndo, onRedo, onMoveClick }: MoveHistoryProps) {
  const canUndo = cursor > 0;
  const canRedo = cursor < moves.length;

  // Format moves in pairs (White: move, Black: move)
  const movePairs: Array<[string, string | undefined]> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="bg-slate-100 p-4 rounded-lg">
      <div className="flex gap-2 mb-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-slate-300 hover:bg-blue-600"
        >
          ← Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-slate-300 hover:bg-blue-600"
        >
          Redo →
        </button>
      </div>

      <div className="bg-white p-3 rounded border border-slate-300 h-32 overflow-y-auto">
        {movePairs.length === 0 ? (
          <p className="text-slate-500 text-sm">No moves yet</p>
        ) : (
          <div className="space-y-1">
            {movePairs.map((pair, i) => (
              <div key={i} className="text-sm font-mono">
                <span className="text-slate-500 mr-2">{i + 1}.</span>
                <button
                  onClick={() => onMoveClick(i * 2)}
                  className={`px-1 rounded hover:bg-slate-200 cursor-pointer ${
                    i * 2 < cursor ? 'text-slate-900 font-semibold' : 'text-slate-400'
                  } ${i * 2 === cursor ? 'bg-yellow-200' : ''}`}
                >
                  {pair[0]}
                </button>
                {pair[1] && (
                  <button
                    onClick={() => onMoveClick(i * 2 + 1)}
                    className={`ml-3 px-1 rounded hover:bg-slate-200 cursor-pointer ${
                      i * 2 + 1 < cursor ? 'text-slate-900' : 'text-slate-400'
                    } ${i * 2 + 1 === cursor ? 'bg-yellow-200' : ''}`}
                  >
                    {pair[1]}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
