// geometry.ts
// Vector now uses the generic brand system (brand.ts). Brands are reusable globally.

import { add, divide, multiply, subtract } from "./math";
import { brand, Branded } from "./brand";

export type VectorBrand = "Any" | "Position" | "Size" | "Offset" | "Center";

export enum Dimension { X = "x", Y = "y" }

export type Fold = (value: number) => number;
export type NestFold = (vector: Vector) => number;
export type FoldWith = (value1: number, value2: number) => number;
export type Reduce = (x: number, y: number) => number;

export class Vector {
  constructor(public readonly x: number, public readonly y: number) {}

  public as<B extends VectorBrand>(b: B): Branded<Vector, B> {
    // keep a debug runtime brand
    return brand(this, b);
  }
  public asPosition() { return this.as("Position"); }
  public asSize()     { return this.as("Size"); }
  public asOffset()   { return this.as("Offset"); }
  public asCenter()   { return this.as("Center"); }

  public reflect = (axis: Dimension) => (axis === Dimension.X ? new Vector(this.x, -this.y) : new Vector(-this.x, this.y));
  public scale = (factor: number) => this.multiply(Vector.scalar(factor));
  public sum = () => this.reduce(add);
  public crossProduct = (vector: Vector) => this.reflect(Dimension.X).dotProduct(vector.swap());
  public normalize = () => this.scale(1 / this.length());
  public length = () => Math.sqrt(this.dotProduct(this));
  public round = () => this.map(Math.round);
  public map = (f: Fold) => this.fold(f, f);
  public reduce = (f: Reduce) => f(this.x, this.y);
  static scalar = (scalar: number) => new Vector(scalar, scalar);
  public trig = () => this.fold(Math.cos, Math.sin);
  public swap = () => new Vector(this.y, this.x);
  public area = () => this.reduce(multiply);
  public aspectRatio = () => this.reduce(divide);
  public add = (vector: Vector) => this.mapWith(add, vector);
  public multiply = (vector: Vector) => this.mapWith(multiply, vector);
  public subtract = (vector: Vector) => this.mapWith(subtract, vector);
  public divide = (vector: Vector) => this.mapWith(divide, vector);
  public max = () => this.reduce(Math.max);
  public min = () => this.reduce(Math.min);
  public negate = () => this.scale(-1);
  public halve = () => this.scale(1 / 2);
  public dotProduct = (vector: Vector) => this.multiply(vector).sum();
  public rotate = (radians: number) =>
    Vector.scalar(radians).trig().nestFold(
      (v: Vector) => v.reflect(Dimension.X).multiply(this).sum(),
      (v: Vector) => v.swap().multiply(this).sum()
    );
  public clamp = (min: number = -Infinity, max: number = Infinity) =>
    this.map((x: number) => Math.min(Math.max(x, min), max));
  public nestFold = (left: NestFold, right: NestFold) => new Vector(left(this), right(this));
  public mapWith = (f: FoldWith, vector: Vector) => this.foldWith(f, f, vector);
  public foldWith = (left: FoldWith, right: FoldWith, vector: Vector) =>
    new Vector(left(this.x, vector.x), right(this.y, vector.y));
  public fold = (left: Fold, right: Fold) => new Vector(left(this.x), right(this.y));
}

export namespace Shapes {
  export class Rectangle {
    constructor(public size: Vector, public position: Vector) {
      this.size = size.as("Size");
      this.position = position.as("Position");
    }
    getPosition(): Branded<Vector, "Position"> { return this.position.as("Position"); }
    getSize(): Branded<Vector, "Size"> { return this.size.as("Size"); }
  }

  export class Box extends Rectangle {
    constructor(
      public id: string,
      position: Vector,
      size: Vector,
      public parentId?: string,
      public depth: number = 0
    ) {
      super(size, position);
    }
    setDepth(d: number): this { this.depth = d; return this; }
  }
}
