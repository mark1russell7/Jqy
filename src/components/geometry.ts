import { 
    add, 
    divide, 
    multiply, 
    subtract 
} from "./math";

export enum Dimension 
{
    X = "x",
    Y = "y"
}
export type Fold        =   (value  : number) => number;
export type NestFold    =   (vector : Vector) => number;
export type FoldWith    =   (
                                value1 : number, 
                                value2 : number
                            ) => number;
export type Reduce      =   (
                                x : number, 
                                y : number
                            ) => number;
export class Vector 
{
    constructor (
                    public readonly x : number, 
                    public readonly y : number
                ) 
    {

    }
    public  reflect         =   (axis       : Dimension )   =>  axis === Dimension.X 
                                                                    ? new Vector( this.x, -this.y) 
                                                                    : new Vector(-this.x,  this.y);
    public  scale           =   (factor     : number    )   =>  this.multiply   (Vector.scalar(factor));
    public  sum             =   (                       )   =>  this.reduce     (add);
    public  crossProduct    =   (vector     : Vector    )   =>  this.reflect    (Dimension.X)
                                                                    .dotProduct (vector.swap());
    public  normalize       =   (                       )   =>  this.scale      (1 / this.length());
    public  length          =   (                       )   =>  Math.sqrt       (this.dotProduct(this)); // Math.hypot(this.x, this.y); is more numerically stable
    public  round           =   (                       )   =>  this.map        (Math.round);
    public  map             =   (f          : Fold      )   =>  this.fold       (f,f);
    public  reduce          =   (f          : Reduce    )   =>  f               (this.x, this.y);
    static  scalar          =   (scalar     : number    )   =>  new Vector      (scalar, scalar);
    public  trig            =   (                       )   =>  this.fold       (Math.cos, Math.sin);
    public  swap            =   (                       )   =>  new Vector      (this.y, this.x);
    public  area            =   (                       )   =>  this.reduce     (multiply);
    public  aspectRatio     =   (                       )   =>  this.reduce     (divide);
    public  add             =   (vector     :   Vector  )   =>  this.mapWith    (add        , vector);
    public  multiply        =   (vector     :   Vector  )   =>  this.mapWith    (multiply   , vector);
    public  subtract        =   (vector     :   Vector  )   =>  this.mapWith    (subtract   , vector);
    public  divide          =   (vector     :   Vector  )   =>  this.mapWith    (divide     , vector);
    public  max             =   (                       )   =>  this.reduce     (Math.max);
    public  min             =   (                       )   =>  this.reduce     (Math.min);
    public  negate          =   (                       )   =>  this.scale      (-1);
    public  halve           =   (                       )   =>  this.scale      (1 / 2);
    public  dotProduct      =   (vector     :   Vector  )   =>  this.multiply   (vector)
                                                                    .sum        ();
    public  rotate          =   (radians    :   number  )   =>  Vector
                                                                    .scalar     (radians)
                                                                    .trig       ()
                                                                    .nestFold   (
                                                                                    (v : Vector) => v
                                                                                                        .reflect(Dimension.X)
                                                                                                        .multiply(this)
                                                                                                        .sum(),
                                                                                    (v : Vector) => v
                                                                                                        .swap()
                                                                                                        .multiply(this)
                                                                                                        .sum()
                                                                                );
    public  clamp           =   (
                                    min     : number = -Infinity, 
                                    max     : number =  Infinity
                                ) => this.map   (
                                                    (x : number) => 
                                                                    Math.min(
                                                                                Math.max(
                                                                                            x, 
                                                                                            min
                                                                                        ), 
                                                                                max
                                                                            )
                                                );
    public  nestFold        =   (   
                                    left    : NestFold, 
                                    right   : NestFold
                                ) => new Vector (
                                                    left(this), 
                                                    right(this)
                                                );
    public  mapWith         =   (
                                    f       : FoldWith, 
                                    vector  : Vector
                                ) => this.foldWith  (
                                                        f, 
                                                        f, 
                                                        vector
                                                    );
    public  foldWith        =   (   
                                    left    : FoldWith, 
                                    right   : FoldWith, 
                                    vector  : Vector
                                ) => new Vector (
                                                    left (this.x, vector.x), 
                                                    right(this.y, vector.y)
                                                );
    public  fold            =   (
                                    left    : Fold, 
                                    right   : Fold
                                ) => new Vector (
                                                    left(this.x), 
                                                    right(this.y)
                                                );
}

export namespace Shapes 
{
    export class Rectangle
    {
        constructor(
            public size     : Vector,
            public position : Vector
        ) 
        {

        }
        getPosition() : Vector 
        {
            return this.position;
        }
        getSize() : Vector 
        {
            return this.size;
        }
    }
}
console.log(new Vector(3,4).length());                 // 5
console.log(new Vector(1,0).rotate(Math.PI/2));        // ~ (0,1)
console.log(new Vector(2,3).crossProduct(new Vector(5,7))); // 2*7 - 3*5 = -1