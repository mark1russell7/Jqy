import { 
    Vector, 
    Shapes 
} from "../../geometry";
export class GridItem<T> 
{
    constructor(
        public cell       : Vector,
        public dimensions : Shapes.Rectangle,
        public data       : T
    ) 
    { 

    }
}


export class Grid<T> 
{
    public grid : GridItem<T | undefined>[][];
    constructor(public size : Vector) 
    {
        this.grid = Array
                        .from(
                            { 
                                length : size.y 
                            }, 
                            () => Array
                                    .from(
                                        { 
                                            length : size.x 
                                        }, 
                                        () => new GridItem<undefined>(
                                                                new Vector(0, 0), 
                                                                new Shapes.Rectangle(
                                                                                        new Vector(0, 0), 
                                                                                        new Vector(0, 0)
                                                                                    ),
                                                                undefined
                                                             )
                                    )
                        );
    }
    set =   (
                cell : Vector, 
                item : GridItem<T>
            ) 
            : void =>
                        void (this.grid[cell.y][cell.x] = item);
    get =   (
                cell : Vector
            ) 
            : GridItem<T | undefined> => 
                            this.grid[cell.y][cell.x];
}
