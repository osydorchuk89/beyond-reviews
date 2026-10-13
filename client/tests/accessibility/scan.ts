import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

type ScanResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

// Finding IDs link each allowed rule to the audit. Only observed nodes are baselined.
const findingsByRule: Record<string, string[]> = {
    "color-contrast": ["A08"],
    label: ["A02", "A04"],
    list: ["A12"],
    listitem: ["A12"],
    "landmark-one-main": ["A06"],
    "page-has-heading-one": ["A06"],
    region: ["A06"],
    "heading-order": ["A06"],
    "scrollable-region-focusable": ["A13"],
};

export function fingerprints(violations: ScanResults["violations"]) {
    return violations
        .map((violation) => ({
            rule: violation.id,
            findings: findingsByRule[violation.id] ?? [],
            nodes: violation.nodes
                .map((node) => ({
                    target: node.target,
                    failedChecks: [
                        ...new Set(
                            [...node.any, ...node.all, ...node.none].map(
                                (check) => check.id,
                            ),
                        ),
                    ].sort(),
                }))
                .sort((a, b) =>
                    JSON.stringify(a).localeCompare(JSON.stringify(b), "en"),
                ),
        }))
        .sort((a, b) => a.rule.localeCompare(b.rule, "en"));
}

export async function analyze(page: Page) {
    // Fonts and images affect contrast/layout. Scan settled content, not loading skeletons.
    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
            Array.from(document.images, (image) =>
                image.decode().catch(() => undefined),
            ),
        );
    });
    return new AxeBuilder({ page })
        .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "wcag22aa",
            "best-practice",
        ])
        .analyze();
}

export async function scan(page: Page, info: TestInfo, state: string) {
    const results = await analyze(page);
    await info.attach(`${state}-axe.json`, {
        body: JSON.stringify(
            {
                state,
                route:
                    new URL(page.url()).pathname + new URL(page.url()).search,
                engine: results.testEngine,
                environment: results.testEnvironment,
                violations: results.violations,
                incomplete: results.incomplete,
            },
            null,
            2,
        ),
        contentType: "application/json",
    });

    const actual = fingerprints(results.violations);
    expect(
        actual.filter((violation) => violation.findings.length === 0),
        "Investigate unmapped rules and add them to the findings register before baselining",
    ).toEqual([]);
    // Exact matching catches new nodes/checks and requires removal of resolved exceptions.
    // Default/CI runs cannot create or update missing baselines.
    expect(JSON.stringify(actual, null, 2)).toMatchSnapshot(`${state}.json`);
}
