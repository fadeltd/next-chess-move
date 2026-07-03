declare module 'react-chess-pieces' {
  import { FC } from 'react';

  interface PieceProps {
    piece: string;
  }

  const Piece: FC<PieceProps>;
  export default Piece;
}
