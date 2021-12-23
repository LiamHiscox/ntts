import { Node } from 'ts-morph';

const flatten = (node: Node | undefined) => node?.getText().replace(/\s+/g, ' ') || '';

export default flatten;
