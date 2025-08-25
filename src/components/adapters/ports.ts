// ports.ts
// - Cleanly separates PortKind from Target
// - No magic string literals in your codebase

import React from "react";
import { RunLayoutApiInput } from "./api.adapter";
import { LayoutResultEx } from "../layout/engine/layout.engine";
import { Target } from "./env";

export enum PortKind {
  API = "api",
  React = "react",
  Vanilla = "vanilla",
}

export type ApiPort = { kind: PortKind.API; run: (input: RunLayoutApiInput) => LayoutResultEx };
export type ReactPort = { kind: PortKind.React; component: React.ComponentType<any> };
export type VanillaPort = {
  kind: PortKind.Vanilla;
  mount: (
    container: HTMLElement,
    initial: LayoutResultEx
  ) => { update(r: LayoutResultEx): void; destroy(): void };
};

export type Port = ApiPort | ReactPort | VanillaPort;

export type TargetAdapter =
  | { target: Target.API; port: ApiPort }
  | { target: Target.DOM | Target.Canvas | Target.ReactFlow; port: ReactPort | VanillaPort };
