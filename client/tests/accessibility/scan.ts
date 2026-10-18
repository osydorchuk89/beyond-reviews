import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo } from "@playwright/test";

type ScanResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

export function fingerprints(violations: ScanResults["violations"]) {
    return violations
        .map((violation) => ({
            rule: violation.id,
            nodes: violation.nodes
                .map((node) => ({
                    target: node.target,
                    failedChecks: [
                        ...new Set(
                            [...node.any, ...node.all, ...node.none].map(
                                (check) => check.id,
                            ),
                        ),
                    ].sort((left, right) => {
                        if (left === right) return 0;
                        return left < right ? -1 : 1;
                    }),
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
    if ((await page.getByRole("dialog").count()) === 0) {
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(page).not.toHaveTitle("Beyond Reviews");
    }
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
        actual,
        "Fix accessibility violations before accepting this change",
    ).toEqual([]);
}
