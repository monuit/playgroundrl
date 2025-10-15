import { parse } from "acorn";

const FORBIDDEN_IDENTIFIERS = new Set([
  "window",
  "self",
  "globalThis",
  "document",
  "fetch",
  "XMLHttpRequest",
  "Function",
  "eval",
  "WebSocket",
  "Worker",
  "SharedArrayBuffer",
]);

const FORBIDDEN_NODE_TYPES = new Set([
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportDefaultDeclaration",
  "ExportAllDeclaration",
  "WithStatement",
  "DebuggerStatement",
  "ThisExpression",
  "TryStatement",
  "CatchClause",
  "ThrowStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ForStatement",
  "ForOfStatement",
  "ForInStatement",
  "ClassDeclaration",
  "ClassExpression",
]);

const FORBIDDEN_MEMBERS = new Set(["constructor", "prototype", "__proto__"]);
const MAX_SOURCE_LENGTH = 1500;
const MAX_AST_NODES = 2000;

export class RewardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RewardValidationError";
  }
}

type AstNode = { type: string } & Record<string, unknown>;

export const validateRewardSource = (source: string) => {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new RewardValidationError(
      `Reward scripts must be under ${MAX_SOURCE_LENGTH} characters.`
    );
  }

  let ast: unknown;
  try {
    ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "script",
    });
  } catch (error) {
    throw new RewardValidationError(
      `Reward source failed to parse: ${(error as Error).message}`
    );
  }

  const stack: AstNode[] = [ast as AstNode];
  let visitedNodes = 0;

  while (stack.length) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    visitedNodes += 1;
    if (visitedNodes > MAX_AST_NODES) {
      throw new RewardValidationError(
        "Reward script is too complex. Simplify the logic before applying."
      );
    }

    if (FORBIDDEN_NODE_TYPES.has(node.type)) {
      throw new RewardValidationError(
        `Use of ${node.type} is not permitted in reward scripts.`
      );
    }

    if (node.type === "Identifier" && "name" in node && FORBIDDEN_IDENTIFIERS.has(String(node.name))) {
      throw new RewardValidationError(`Identifier "${String(node.name)}" is not permitted.`);
    }

    if (node.type === "CallExpression" || node.type === "NewExpression") {
      const callee = (node as Record<string, unknown>).callee as AstNode | undefined;
      if (callee?.type === "Identifier" && "name" in callee && FORBIDDEN_IDENTIFIERS.has(String(callee.name))) {
        throw new RewardValidationError(`Calling "${String(callee.name)}" is not permitted.`);
      }
    }

    if (node.type === "MemberExpression") {
      const memberNode = node as unknown as {
        object: AstNode;
        property: AstNode;
        computed?: boolean;
      };
      const object = memberNode.object;
      if (
        object?.type === "Identifier" &&
        "name" in object &&
        FORBIDDEN_IDENTIFIERS.has(String(object.name))
      ) {
        throw new RewardValidationError(
          `Accessing properties on "${String(object.name)}" is not permitted.`
        );
      }
      if (!memberNode.computed) {
        const property = memberNode.property as AstNode & { name?: string };
        if (property?.name && FORBIDDEN_MEMBERS.has(property.name)) {
          throw new RewardValidationError(
            `Accessing dangerous property "${property.name}" is blocked.`
          );
        }
      }
    }

    Object.values(node).forEach((value) => {
      if (!value) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === "object" && "type" in (child as Record<string, unknown>)) {
            stack.push(child as AstNode);
          }
        });
      } else if (typeof value === "object" && "type" in (value as Record<string, unknown>)) {
        stack.push(value as AstNode);
      }
    });
  }
};
