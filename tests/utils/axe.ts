import { axe, AxeResults } from "jest-axe";

function formatViolations(results: AxeResults, context: string): string {
  return results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    • Affected node(s): ${node.target.join(", ")}`)
        .join("\n");
      return [
        `${violation.id}: ${violation.help}.`,
        `    Fix guidance: ${violation.helpUrl}`,
        nodes,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export async function expectNoAxeViolations(
  element: Element | Document,
  context: string,
) {
  const results = await axe(element);
  if (results.violations.length > 0) {
    const details = formatViolations(results, context);
    throw new Error(
      `Accessibility issues detected in ${context}. Please address the following:\n${details}`,
    );
  }
}
