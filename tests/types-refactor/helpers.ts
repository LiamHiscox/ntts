import {Node} from "ts-morph";

export const flatten = (node: Node | undefined) => node?.getText().replace(/\s+/g, ' ') || "";
