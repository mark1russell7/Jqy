// geometry.ts
// - Adds Vector branding (Position/Size/Offset/Any) with Vector.as(brand)
// - Shapes.Rectangle stores branded position/size but remains compatible
// - Shapes.Box adds depth (z) and parentId, getters preserve brands

import { add, divide, multiply, subtract } from "./math";

export type VectorBrand = "Any" | "Position" | "Size" | "Offset" | "Center";
export type BrandRegistry = Record<VectorBrand, { description: string }>;

export const VectorBrands: BrandRegistry = {
  Any: { description: "unbranded vector (generic)" },
  Position: { description: "top-left or absolute position" },
  Size: { description: "width/height size vector" },
  Offset: { description: "delta/translation vector" },
  Center: { description: "center point (often computed)" },
};

export enum Dimension {
  X = "x",
  Y = "y",
}

export type Fold = (value: number) => number;
export type NestFold = (vector: Vector) => number;
export type FoldWith = (value1: number, value2: number) => number;
export type Reduce = (x: number, y: number) => number;

export class Vector {
  // NOTE: __brand is intentionally not readonly so .as(...) can rebrand in place (purely for typing).
  //       At runtime we also set a non-enumerable property for easier debugging.
  public __brand?: VectorBrand;

  constructor(public readonly x: number, public readonly y: number) {}

  public as<B extends VectorBrand>(brand: B): Vector & { __brand: B } {
    // attach a non-enumerable brand for debugging, while returning a branded type
    Object.defineProperty(this, "__brand", { value: brand, enumerable: false, configurable: true });
    return this as unknown as Vector & { __brand: B };
  }

  // convenience shorthands
  public asPosition() { return this.as("Position"); }
  public asSize() { return this.as("Size"); }
  public asOffset() { return this.as("Offset"); }
  public asCenter() { return this.as("Center"); }

  public reflect = (axis: Dimension) => (axis === Dimension.X ? new Vector(this.x, -this.y) : new Vector(-this.x, this.y));
  public scale = (factor: number) => this.multiply(Vector.scalar(factor));
  public sum = () => this.reduce(add);
  public crossProduct = (vector: Vector) => this.reflect(Dimension.X).dotProduct(vector.swap());
  public normalize = () => this.scale(1 / this.length());
  public length = () => Math.sqrt(this.dotProduct(this)); // hypot would be more stable
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
      // ensure stored shape uses branded vectors internally
      this.size = size.as("Size");
      this.position = position.as("Position");
    }
    getPosition(): Vector & { __brand: VectorBrand } {
      return this.position.as("Position");
    }
    getSize(): Vector & { __brand: VectorBrand } {
      return this.size.as("Size");
    }
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
    setDepth(d: number): this {
      this.depth = d;
      return this;
    }
  }
}
