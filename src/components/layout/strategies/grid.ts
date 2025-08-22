import { Vector, Shapes } from "../../geometry";


export class GridItem<T> {
    constructor(
        public cell: Vector,
        public dimensions: Shapes.Rectangle,
        public data?: T
    ) { }
}

export class Grid<T> {
    public grid: GridItem<T>[][];
    constructor(public size: Vector) {
        this.grid = Array.from({ length: size.y }, () => Array.from({ length: size.x }, () => new GridItem<T>(new Vector(0, 0), new Shapes.Rectangle(new Vector(0, 0), new Vector(0, 0))))
        );
    }
    set(cell: Vector, item: GridItem<T>) {
        this.grid[cell.y][cell.x] = item;
    }
}
