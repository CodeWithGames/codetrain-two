import { mapSprites, spriteSquares } from './units';

const mapPixels = 256;
const spritePixels = Math.round(mapPixels / mapSprites);
const squarePixels = Math.round(spritePixels / spriteSquares);

const properties = [
  'colors', 'codes',
  'objectSprites', 'tileSprites',
  'objects', 'tiles'
];

export default function getGameSrc(props) {
  // check for all properties
  for (const prop of properties) {
    if (props[prop] === undefined) {
      throw new TypeError(`${prop} not passed to gameSrc`);
    }
  }

  return (
`<html>
  <body onload="__start__()">
    <canvas
      id="__canvas__"
      width=${mapPixels}
      height=${mapPixels}
    />
  </body>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background: #fff;
    }
    .error {
      margin: 10px;
      position: absolute;
      top: 0;
      color: red;
      font-size: 12px;
      font-family:
        'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
    }
  </style>
  <script>
    class GameObject {
      constructor(index) {
        this.index = index;
      }
      start() {}
      update() {}
      move(dir) {
        if (dir === 'up') $$.objects[this.index].y -= $$.spriteSquares;
        else if (dir === 'down') $$.objects[this.index].y += $$.spriteSquares;
        else if (dir === 'left') $$.objects[this.index].x -= $$.spriteSquares;
        else if (dir === 'right') $$.objects[this.index].x += $$.spriteSquares;
      }
      moveTiles(x, y) {
        $$.objects[this.index].x += x * $$.spriteSquares;
        $$.objects[this.index].y += y * $$.spriteSquares;
      }
      movePixels(x, y) {
        $$.objects[this.index].x += x;
        $$.objects[this.index].y += y;
      }
      }
    }
    const $$ = {
      ctx: __canvas__.getContext('2d'),
      mapPixels: ${mapPixels},
      mapSprites: ${mapSprites},
      spriteSquares: ${spriteSquares},
      squarePixels: ${squarePixels},
      colors: ${JSON.stringify(props.colors)},
      codes: ${JSON.stringify(props.codes)},
      objectSprites: ${JSON.stringify(props.objectSprites)},
      tileSprites: ${JSON.stringify(props.tileSprites)},
      objects: ${JSON.stringify(props.objects)},
      tiles: ${JSON.stringify(props.tiles)},
      objectCodes: [],
      sounds: {},
      texts: {},
      onError: (error, i) => {
        // search for error position in stack
        const errorLines = error.stack.split('\\n').slice(1);
        let errorPosition;
        // for each error line
        for (const errorLine of errorLines) {
          // get anonymous index and skip if none
          const anonymousIndex = errorLine.indexOf('<anonymous>:');
          if (anonymousIndex === -1) continue;
          // get error position and break
          errorPosition = errorLine.slice(anonymousIndex + 12, -1).split(':');
          break;
        }
        // clear canvas
        $$.ctx.clearRect(0, 0, $$.mapPixels, $$.mapPixels);
        // create error text
        const p = document.createElement('p');
        p.className = 'error';
        // if error position found
        if (errorPosition) {
          // get error row and col
          const errorRow = parseInt(errorPosition[0]) - 2;
          const errorCol = parseInt(errorPosition[1]);
          // append canvas text
          p.innerText = \`Object \${i} (line \${errorRow} col \${errorCol}):\\n\${error.stack.split("\\n")[0]}\\n\`;
          document.body.appendChild(p);
          window.parent.onError(error, i, errorRow, errorCol);
        // if no error position found
        } else {
          // append canvas text
          p.innerText = \`Object \${i}:\\n\${error.stack.split("\\n")[0]}\\n\`;
          document.body.appendChild(p);
          window.parent.onError(error, i);
        }
      },
      lastPressedKeys: {},
      pressedKeys: {},
      getCodeFunction: (gameObject, index) => {
        return new (new Function($$.codes[gameObject.objectIndex])())(index);
      }
    };
    // listen for key down
    window.addEventListener('keydown', e => {
      const keyName = e.key.toLowerCase();
      $$.pressedKeys[keyName] = true;
    });
    // listen for key up
    window.addEventListener('keyup', e => {
      const keyName = e.key.toLowerCase();
      $$.pressedKeys[keyName] = false;
    });
    // returns whether given key down
    function isKeyDown(key) {
      // handle invalid key
      if (typeof key !== 'string' || !key.length) {
        throw new TypeError(\`Invalid key \${key}\`);
      }
      // handle key name
      const keyName = key.toLowerCase();
      return $$.pressedKeys[keyName];
    }
    // returns whether given key pressed
    function isKey(key) {
      // handle invalid key
      if (typeof key !== 'string' || !key.length) {
        throw new TypeError(\`Invalid key \${key}\`);
      }
      // handle key name
      const keyName = key.toLowerCase();
      return $$.pressedKeys[keyName] && !$$.lastPressedKeys[keyName];
    }
    // get object by index
    function getObject(index) {
      return $$.objectCodes[index];
    }
    // adds sound to index
    function addSound(name, url) {
      const audio = document.createElement('audio');
      audio.src = url;
      $$.sounds[name] = audio;
    }
    // plays sound from index
    function playSound(name) {
      const sound = $$.sounds[name];
      if (!sound) throw new ReferenceError(\`\${name} is not a sound\`);
      else sound.play();
    }
    // creates object at given position
    function createObject(object, x, y) {
      // construct object
      const gameObject = { object, x, y };
      const index = $$.objects.length;
      // push new object
      $$.objects.push(gameObject);
      const code = $$.getCodeFunction(gameObject, index);
      code.start();
      $$.objectCodes.push(code);
      return code;
    }
    // deletes object with given index
    function deleteObject(index) {
      // splice object
      $$.objects.splice(index, 1);
      $$.objectCodes.splice(index, 1);
      // update code indexes
      $$.objectCodes.forEach((code, i) => code.index = i);
    }
    // create text
    function addText(text, x, y, options) {
      const id = options?.id ?? Math.random().toString();
      const color = options?.color ?? 'black';
      const size = options?.size ?? 16;
      $$.texts[id] = { text, x, y, color, size, id };
      return $$.texts[id];
    }
    // remove text
    function removeText(id) {
      if (!$$.texts[id]) {
        throw new ReferenceError(\`\${id} is not a text\`);
      }
      delete $$.texts[id];
    }
    function __start__() {
      // draws given sprite at given position
      function drawSprite(object, squareX, squareY) {
        // for each square
        for (let x = 0; x < $$.spriteSquares; x++) {
          for (let y = 0; y < $$.spriteSquares; y++) {
            // set fill color
            const squareIndex = y * $$.spriteSquares + x;
            const colorIndex = object[squareIndex];
            if (colorIndex === -1) continue;
            const color = $$.colors[colorIndex];
            $$.ctx.fillStyle = color;
            // get pixel position
            let pixelX = (squareX * $$.squarePixels) + (x * $$.squarePixels);
            let pixelY = (squareY * $$.squarePixels) + (y * $$.squarePixels);
            // fill square
            $$.ctx.fillRect(pixelX, pixelY, $$.squarePixels, $$.squarePixels);
          }
        }
      }
      // draws canvas
      function draw() {
        // clear canvas
        $$.ctx.clearRect(0, 0, $$.mapPixels, $$.mapPixels);
        // for each tile
        for (let x = 0; x < $$.mapSprites; x++) {
          for (let y = 0; y < $$.mapSprites; y++) {
            // draw tile
            const gameTileIndex = y * $$.mapSprites + x;
            const tileIndex = $$.tiles[gameTileIndex];
            const tile = $$.tileSprites[tileIndex];
            drawObject(tile, x * $$.spriteSquares, y * $$.spriteSquares);
          }
        }
        // for each object
        for (const gameObject of $$.objects) {
          // draw object
          const { x, y } = gameObject;
          const object = $$.objectSprites[gameObject.objectIndex];
          drawObject(object, x, y);
        }
        // for each text
        for (const id in $$.texts) {
          // get text values
          const { text, x, y, color, size } = $$.texts[id];
          const pixelX = x * $$.squarePixels;
          const pixelY = y * $$.squarePixels + size;
          // draw text
          $$.ctx.fillStyle = color;
          $$.ctx.font = \`\${size}px monospace\`;
          $$.ctx.fillText(text, pixelX, pixelY);
        }
      }
      // runs game loop
      function gameLoop(time) {
        // run update
        for (let i = 0; i < $$.objectCodes.length; i++) {
          const code = $$.objectCodes[i];
          try {
            code.update();
          } catch (e) {
            // throw error with object
            const object = $$.objects[i].object;
            $$.onError(e, object);
            return;
          }
        }
        // draw canvas
        draw();
        // update keys
        $$.lastPressedKeys = Object.assign({}, $$.pressedKeys);
        // continue loop
        requestAnimationFrame(gameLoop);
      }
      // construct code functions
      for (let i = 0; i < $$.objects.length; i++) {
        const gameObject = $$.objects[i];
        try {
          const code = $$.getCodeFunction(gameObject, i);
          $$.objectCodes.push(code);
        } catch(e) {
          // throw error with object
          const object = gameObject.object;
          $$.onError(e, object);
          return;
        }
      }
      // run start functions
      for (let i = 0; i < $$.objectCodes.length; i++) {
        const code = $$.objectCodes[i];
        try {
          code.start();
        } catch(e) {
          // throw error with object
          const object = $$.objects[i].object;
          $$.onError(e, object);
          return;
        }
      }
      // start loop
      requestAnimationFrame(gameLoop);
    }
  </script>
</html>
`
  );
}
