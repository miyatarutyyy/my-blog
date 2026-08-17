import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const soukouFontAttribute = "data-font";
const soukouFontValue = "soukou";
const skkTypingName = "SkkTyping";
const skkMarkerText = "▽▼";

export async function collectSoukouCorpus({
  projectRoot = process.cwd(),
} = {}) {
  const tsxFiles = await findFiles(path.join(projectRoot, "src"), (filePath) =>
    filePath.endsWith(".tsx")
  );
  const fragmentFiles = await findFiles(
    path.join(projectRoot, "src"),
    (filePath) => filePath.endsWith(".soukou-corpus.txt")
  );
  const collectedTexts = [];

  for (const filePath of tsxFiles) {
    const sourceText = await readFile(filePath, "utf8");
    const result = collectSoukouCorpusFromTsx(sourceText, {
      filePath: path.relative(projectRoot, filePath),
    });

    collectedTexts.push(...result.texts);
  }

  for (const filePath of fragmentFiles) {
    collectedTexts.push(await readCorpusFragment(filePath));
  }

  return {
    corpus: uniqueCharacters(collectedTexts.join("\n")).join(""),
    tsxFiles,
    fragmentFiles,
  };
}

export function collectSoukouCorpusFromTsx(sourceText, { filePath = "" } = {}) {
  const sourceFile = ts.createSourceFile(
    filePath || "source.tsx",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const skkPlans = collectSkkPlanDeclarations(sourceFile);
  const texts = [];

  function visit(node) {
    if (ts.isJsxElement(node) && hasSoukouFontAttribute(node.openingElement)) {
      collectFromMarkedJsx(node, { sourceFile, skkPlans, texts });
      return;
    }

    if (
      ts.isJsxSelfClosingElement(node) &&
      hasSoukouFontAttribute(node) &&
      getJsxTagName(node.tagName) === skkTypingName
    ) {
      collectFromSkkTyping(node, { sourceFile, skkPlans, texts });
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    texts,
  };
}

async function findFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findFiles(filePath, predicate)));
      continue;
    }

    if (entry.isFile() && predicate(filePath)) {
      files.push(filePath);
    }
  }

  return files.sort();
}

async function readCorpusFragment(filePath) {
  const text = await readFile(filePath, "utf8");

  return text
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n")
    .trim();
}

function collectSkkPlanDeclarations(sourceFile) {
  const plans = new Map();

  function visit(node) {
    if (!ts.isVariableStatement(node)) {
      ts.forEachChild(node, visit);
      return;
    }

    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      const planStrings = collectSkkPlanStrings(declaration.initializer);

      if (planStrings.length > 0) {
        plans.set(declaration.name.text, planStrings);
      }
    }
  }

  visit(sourceFile);

  return plans;
}

function collectFromMarkedJsx(node, context) {
  for (const child of node.children) {
    collectFromJsxChild(child, context);
  }
}

function collectFromJsxChild(child, context) {
  if (ts.isJsxText(child)) {
    const text = normalizeJsxText(child.getText(context.sourceFile));

    if (text !== "") {
      context.texts.push(text);
    }

    return;
  }

  if (ts.isJsxExpression(child)) {
    collectFromExpressionChild(child, context);
    return;
  }

  if (ts.isJsxElement(child)) {
    collectFromMarkedJsx(child, context);
    return;
  }

  if (ts.isJsxSelfClosingElement(child)) {
    if (getJsxTagName(child.tagName) === skkTypingName) {
      collectFromSkkTyping(child, context);
    }

    return;
  }

  if (ts.isJsxFragment(child)) {
    for (const fragmentChild of child.children) {
      collectFromJsxChild(fragmentChild, context);
    }
  }
}

function collectFromExpressionChild(child, context) {
  if (!child.expression) {
    return;
  }

  const expression = unwrapExpression(child.expression);

  if (ts.isStringLiteralLike(expression)) {
    context.texts.push(expression.text);
    return;
  }

  throw new Error(
    `Cannot collect dynamic text for ${soukouFontAttribute}="${soukouFontValue}" at ${formatLocation(
      context.sourceFile,
      expression
    )}. Add a corpus fragment or a domain-specific collector.`
  );
}

function collectFromSkkTyping(node, context) {
  const label = getStringAttribute(node, "label");

  if (label != null) {
    context.texts.push(label);
  }

  const planIdentifier = getIdentifierExpressionAttribute(node, "plan");

  if (planIdentifier == null) {
    throw new Error(
      `Cannot collect SkkTyping plan at ${formatLocation(
        context.sourceFile,
        node
      )}. Use an identifier that points to a static plan declaration.`
    );
  }

  const planStrings = context.skkPlans.get(planIdentifier);

  if (!planStrings) {
    throw new Error(
      `Cannot resolve SkkTyping plan "${planIdentifier}" at ${formatLocation(
        context.sourceFile,
        node
      )}.`
    );
  }

  context.texts.push(...planStrings, skkMarkerText);
}

function collectSkkPlanStrings(expression) {
  const unwrapped = unwrapExpression(expression);

  if (!ts.isArrayLiteralExpression(unwrapped)) {
    return [];
  }

  const texts = [];

  for (const element of unwrapped.elements) {
    const segment = unwrapExpression(element);

    if (!ts.isObjectLiteralExpression(segment)) {
      continue;
    }

    for (const property of segment.properties) {
      if (!ts.isPropertyAssignment(property)) {
        continue;
      }

      const propertyName = getPropertyName(property.name);

      if (!propertyName || !isSkkTextProperty(propertyName)) {
        continue;
      }

      texts.push(...collectStringValues(property.initializer));
    }
  }

  return texts;
}

function collectStringValues(expression) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isStringLiteralLike(unwrapped)) {
    return [unwrapped.text];
  }

  if (ts.isArrayLiteralExpression(unwrapped)) {
    return unwrapped.elements.flatMap((element) =>
      collectStringValues(element)
    );
  }

  return [];
}

function hasSoukouFontAttribute(node) {
  return node.attributes.properties.some((attribute) => {
    if (!ts.isJsxAttribute(attribute)) {
      return false;
    }

    if (attribute.name.text !== soukouFontAttribute) {
      return false;
    }

    return getJsxAttributeString(attribute) === soukouFontValue;
  });
}

function getStringAttribute(node, name) {
  const attribute = getJsxAttribute(node, name);

  if (!attribute) {
    return null;
  }

  return getJsxAttributeString(attribute);
}

function getIdentifierExpressionAttribute(node, name) {
  const attribute = getJsxAttribute(node, name);

  if (!attribute?.initializer || !ts.isJsxExpression(attribute.initializer)) {
    return null;
  }

  const expression = attribute.initializer.expression;

  return expression && ts.isIdentifier(expression) ? expression.text : null;
}

function getJsxAttribute(node, name) {
  return node.attributes.properties.find((attribute) => {
    return ts.isJsxAttribute(attribute) && attribute.name.text === name;
  });
}

function getJsxAttributeString(attribute) {
  if (!attribute.initializer) {
    return null;
  }

  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }

  if (!ts.isJsxExpression(attribute.initializer)) {
    return null;
  }

  const expression = attribute.initializer.expression;

  return expression && ts.isStringLiteralLike(expression)
    ? expression.text
    : null;
}

function getJsxTagName(tagName) {
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }

  return tagName.getText();
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return null;
}

function isSkkTextProperty(propertyName) {
  return (
    propertyName === "input" ||
    propertyName === "reading" ||
    propertyName === "output" ||
    propertyName === "candidates"
  );
}

function unwrapExpression(expression) {
  let current = expression;

  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function normalizeJsxText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("");
}

function uniqueCharacters(text) {
  return [...new Set(Array.from(text))]
    .filter((character) => character !== "\n" && character !== "\r")
    .sort((a, b) => {
      return a.codePointAt(0) - b.codePointAt(0);
    });
}

function formatLocation(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const location = `${position.line + 1}:${position.character + 1}`;

  return sourceFile.fileName ? `${sourceFile.fileName}:${location}` : location;
}
