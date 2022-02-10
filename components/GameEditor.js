import { useEffect, useRef, useState } from 'react';
import { mouseIndex, mousePosition } from '../util/mouse';
import { fillBorder, fillHover } from '../util/fill';
import { mapSprites, spriteSquares } from '../util/units';

import styles from '../styles/components/GameEditor.module.css';

let canvas, ctx;

export default function GameEditor(props) {
  const { mapPixels, colors, objects, currObject } = props;

  const spritePixels = Math.round(mapPixels / mapSprites);
  const halfSpritePixels = Math.round(spritePixels / 2);
  const squarePixels = Math.round(spritePixels / spriteSquares);
  const halfSpriteSquares = Math.round(spriteSquares / 2);
  const mapSquares = Math.round(mapPixels / squarePixels);

  const [sketching, setSketching] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [gameObjects, setGameObjects] = useState([]);

  const canvasRef = useRef();

  // return clamped square position
  function getClampedPos(e) {
    // get mouse position
    const [mouseX, mouseY] = mousePosition(e, canvas);
    let newX = Math.floor(mouseX / squarePixels) - halfSpriteSquares;
    let newY = Math.floor(mouseY / squarePixels) - halfSpriteSquares;
    // clamp mouse position
    if (newX < 0) newX = 0;
    else if (newX > mapSquares - spriteSquares) newX = mapSquares - spriteSquares;
    if (newY < 0) newY = 0;
    else if (newY > mapSquares - spriteSquares) newY = mapSquares - spriteSquares;
    // return new position
    return [newX, newY];
  }

  // sketches canvas
  function sketch(e) {
    // get clamped position
    const [newX, newY] = getClampedPos(e);
    // if gameobjects
    if (gameObjects.length) {
      // get clicked object
      const clickedObject = gameObjects[gameObjects.length - 1];
      const { x, y, ...obj } = clickedObject;
      const newGameObjects = gameObjects.slice();
      const heldIndex = gameObjects.indexOf(clickedObject);
      // move clicked object
      newGameObjects.splice(heldIndex, 1);
      newGameObjects.push({ x: newX, y: newY, ...obj });
      setGameObjects(newGameObjects);
      return;
    }
  }

  // called on mouse down
  function mouseDown(e) {
    // start sketching
    setSketching(true);
    // get clamped position
    const [newX, newY] = getClampedPos(e);
    // get clicked objects
    const [mouseX, mouseY] = mousePosition(e, canvas);
    const clicked = gameObjects.filter(obj => (
      obj.x * squarePixels >= mouseX - spritePixels &&
      obj.x * squarePixels <= mouseX &&
      obj.y * squarePixels >= mouseY - spritePixels &&
      obj.y * squarePixels <= mouseY
    )).reverse();
    // if clicked object
    if (clicked.length) {
      // get clicked object
      const clickedObject = clicked[0];
      const { x, y, ...obj } = clickedObject;
      const newGameObjects = gameObjects.slice();
      const heldIndex = gameObjects.indexOf(clickedObject);
      // move clicked object
      newGameObjects.splice(heldIndex, 1);
      newGameObjects.push({ x: newX, y: newY, ...obj });
      setGameObjects(newGameObjects);
      return;
    }
    // get mouse position
    const squareX = hoverIndex % mapSquares - halfSpriteSquares;
    const squareY = Math.floor(hoverIndex / mapSquares) - halfSpriteSquares;
    // append new gameobject
    const newGameObject = { x: squareX, y: squareY, object: currObject };
    setGameObjects(val => [...val, newGameObject]);
  }

  // called on mouse move
  function mouseMove(e) {
    // sketch
    if (sketching) sketch(e);
    // get square position
    let [mouseX, mouseY] = mousePosition(e, canvas);
    let squareX = Math.floor(mouseX / squarePixels);
    let squareY = Math.floor(mouseY / squarePixels);
    // clamp square position
    if (squareX < halfSpriteSquares) squareX = halfSpriteSquares;
    else if (squareX > mapSquares - halfSpriteSquares) squareX = mapSquares - halfSpriteSquares;
    if (squareY < halfSpriteSquares) squareY = halfSpriteSquares;
    else if (squareY > mapSquares - halfSpriteSquares) squareY = mapSquares - halfSpriteSquares;
    // calculate square index
    const squareIndex = squareY * mapSquares + squareX;
    // set hover index
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

  // get canvas context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
  }, []);

  // draws editor to canvas
  function draw() {
    // clear canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, mapPixels, mapPixels);
    // draw gameobjects
    for (let i = 0; i < gameObjects.length; i++) {
      const gameObject = gameObjects[i];
      const object = objects[gameObject.object];
      const pixelX = gameObject.x * squarePixels;
      const pixelY = gameObject.y * squarePixels;
      // for each square
      for (let x = 0; x < spriteSquares; x++) {
        for (let y = 0; y < spriteSquares; y++) {
          const squareIndex = y * spriteSquares + x;
          const colorIndex = object[squareIndex];
          if (colorIndex === -1) continue;
          const color = colors[colorIndex];
          ctx.fillStyle = color;
          ctx.fillRect(pixelX + x * squarePixels, pixelY + y * squarePixels, squarePixels, squarePixels);
        }
      }
      // fill hover if last object
      if (i === gameObjects.length - 1) {
        fillHover(ctx, squarePixels, pixelX, pixelY, spritePixels, spritePixels);
      }
    }
    // if hovering
    if (hoverIndex !== -1) {
      // draw hover
      const squareX = hoverIndex % mapSquares;
      const squareY = Math.floor(hoverIndex / mapSquares);
      const pixelX = (squareX * squarePixels) - halfSpritePixels;
      const pixelY = (squareY * squarePixels) - halfSpritePixels;
      // fill border if sketching
      if (sketching) {
        fillBorder(ctx, squarePixels, pixelX, pixelY, spritePixels, spritePixels);
      // fill hover if hovering
      } else {
        fillHover(ctx, squarePixels, pixelX, pixelY, spritePixels, spritePixels);
      }
    }
  }

  // draw on data update
  useEffect(() => {
    draw();
  }, [hoverIndex, colors, objects, gameObjects, sketching]);

  return (
    <canvas
      className={styles.frame}
      ref={canvasRef}
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseUp}
      onMouseLeave={mouseLeave}
      width={mapPixels}
      height={mapPixels}
    />
  );
}
