import { objectCount } from './units';

export const defaultColors = [
  "#dfdfdf",
  "#9f9f9f",
  "#606060",
  "#202020"
];

const defaultObject = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 3, 3, 3, 3, 0, 0,
  0, 0, 3, 3, 3, 3, 0, 0,
  0, 0, 3, 3, 3, 3, 0, 0,
  0, 0, 3, 3, 3, 3, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0
];

export const defaultObjects = Array(objectCount).fill(0).map((val, i) =>
  defaultObject
);

export const defaultCodes = Array(objectCount).fill(0).map((val, i) => (
`// GameObject${i}
return class GameObject${i} extends GameObject {
  constructor(index) {
    super();
    this.index = index;
    // runs before objects constructed
  }
  start() {
    // runs after all objects constructed
  }
  update() {
    // runs once every frame
  }
}
`
));
