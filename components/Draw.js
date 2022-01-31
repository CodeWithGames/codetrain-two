import { useRef, useEffect } from 'react';

import styles from '../styles/components/Draw.module.css';

let sketching = false;

let lastX, lastY;
let canvas, ctx;

const pixelPx = 16;
const spriteSize = 4;
const spritePx = spriteSize * pixelPx;

export default function Draw() {
  const canvasRef = useRef();

  // called on mouse down
  function mouseDown(e) {
    lastX = undefined;
    lastY = undefined;
    sketching = true;
    sketch(e);
  }

  // called on mouse move
  function mouseMove(e) {
    if (sketching) sketch(e);
  }

  // called on mouse up
  function mouseUp(e) {
    sketching = false;
  }

  // called on mouse leave
  function mouseLeave(e) {
    sketching = false;
  }

  // get canvas and context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
  }, []);

  return (
    <div>
      <h1>Draw</h1>
      <canvas
        ref={canvasRef}
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}
        onMouseLeave={mouseLeave}
        width={spritePx}
        height={spritePx}
      />
    </div>
  );
}
