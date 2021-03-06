import IconButton from './IconButton';

import { useRef, useState, useEffect } from 'react';
import { fillBorder, fillHover } from '../util/fill';
import { mouseIndex } from '../util/mouse';
import { spriteSquares } from '../util/units';
import drawSprite from '../util/drawSprite';

import styles from '../styles/components/Draw.module.css';

let lastSquareIndex;
let canvas, ctx;

const squarePixels = 16;
const spritePixels = spriteSquares * squarePixels;

const border = 2;

export default function Draw(props) {
  const {
    colors, currColor,
    objectSprites, setObjectSprites, currObject,
    tileSprites, setTileSprites, currTile
  } = props;

  const [hoverIndex, setHoverIndex] = useState(-1);
  const [sketching, setSketching] = useState(false);
  const [tool, setTool] = useState('pencil');

  const canvasRef = useRef();

  // get sprite modifiers
  const sprites = currObject === -1 ? tileSprites : objectSprites;
  const setSprites = currObject === -1 ? setTileSprites : setObjectSprites;
  const currSprite = currObject === -1 ? currTile : currObject;

  // flood fills given object starting at given index
  function floodFill(object, squareIndex, startColor, endColor) {
    // update color
    if (object[squareIndex] !== startColor) return;
    object[squareIndex] = endColor;
    // recurse up
    if (squareIndex >= spriteSquares) {
      floodFill(object, squareIndex - spriteSquares, startColor, endColor);
    }
    // recurse down
    if (squareIndex < spriteSquares * spriteSquares - spriteSquares) {
      floodFill(object, squareIndex + spriteSquares, startColor, endColor);
    }
    // recurse left
    if (squareIndex % spriteSquares > 0) {
      floodFill(object, squareIndex - 1, startColor, endColor);
    }
    // recurse right
    if (squareIndex % spriteSquares < spriteSquares - 1) {
      floodFill(object, squareIndex + 1, startColor, endColor);
    }
  }

  // sketches canvas with given mouse data
  function sketch(e) {
    // clear tool
    if (tool === 'clear') {
      // confirm clear
      if (!window.confirm('Clear sketch?')) return;
      // clear sprite
      const newSprites = sprites.slice();
      newSprites[currSprite] = Array(spriteSquares * spriteSquares).fill(-1);
      setSprites(newSprites);
      setSketching(false);
      return;
    }
    // calculate square index
    const squareIndex = mouseIndex(e, canvas, squarePixels, spriteSquares);
    // check last square position
    if (squareIndex === lastSquareIndex) return;
    lastSquareIndex = squareIndex;
    // update objects
    const newSprites = sprites.slice();
    const newSprite = sprites[currSprite].slice();
    // pencil tool
    if (tool === 'pencil') {
      // return if same color
      if (newSprite[squareIndex] === currColor) return;
      // update objects
      newSprite[squareIndex] = currColor;
    // eraser tool
    } else if (tool === 'eraser') {
      newSprite[squareIndex] = -1;
    // bucket tool
    } else if (tool === 'bucket') {
      // return if same color
      const squareColor = newSprite[squareIndex];
      if (squareColor === currColor) return;
      // flood fill
      floodFill(newSprite, squareIndex, squareColor, currColor);
    }
    // update objects
    newSprites[currSprite] = newSprite;
    setSprites(newSprites);
  }

  // called on mouse down
  function mouseDown(e) {
    lastSquareIndex = undefined;
    setSketching(true);
    sketch(e);
  }

  // called on mouse move
  function mouseMove(e) {
    // if sketching, sketch
    if (sketching) sketch(e);
    // get and set hover index
    const squareIndex = mouseIndex(e, canvas, squarePixels, spriteSquares);
    setHoverIndex(squareIndex);
  }

  // called on mouse up
  function mouseUp(e) {
    setSketching(false);
  }

  // called on mouse leave
  function mouseLeave(e) {
    setSketching(false);
    setHoverIndex(-1);
  }

  // draws canvas
  function draw() {
    ctx.clearRect(0, 0, spritePixels, spritePixels);
    // get current sprite
    const sprite = sprites[currSprite];
    // draw sprite
    drawSprite(ctx, sprite, 0, 0, colors, squarePixels);
    // if hovering
    if (hoverIndex !== -1) {
      // get hover index
      const hoverX = (hoverIndex % spriteSquares) * squarePixels;
      const hoverY = Math.floor(hoverIndex / spriteSquares) * squarePixels;
      // draw hover
      if (sketching) fillBorder(ctx, border, hoverX, hoverY, squarePixels, squarePixels);
      else fillHover(ctx, border, hoverX, hoverY, squarePixels, squarePixels);
    }
    fillBorder(ctx, border, 0, 0, spritePixels, spritePixels)
  }

  // get canvas and context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
  }, []);

  // draw canvas when data updates
  useEffect(() => {
    draw();
  }, [
    colors,
    objectSprites, currObject,
    tileSprites, currTile,
    hoverIndex, sketching
  ]);

  return (
    <div className={styles.container}>
      <h1>Draw</h1>
      <canvas
        ref={canvasRef}
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}
        onMouseLeave={mouseLeave}
        width={spritePixels}
        height={spritePixels}
      />
      <div className={styles.tools}>
        {
          ['pencil', 'eraser', 'bucket', 'clear'].map(type =>
            <IconButton
              onClick={() => setTool(type)}
              icon={type}
              down={tool === type}
              key={type}
            />
          )
        }
      </div>
    </div>
  );
}
