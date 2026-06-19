import { expect, test } from '@playwright/test';

test('literal scoped prop shares the parent hash with a native element', async ({ page }) => {
  await page.goto('/tests/scoped-props');

  const firstCase = page.locator('article.case', { hasText: 'Explicit scoped literal prop' });
  const native = firstCase.locator('.demo-card.parent-owned');
  const child = firstCase.locator('.child-card.parent-owned');

  await expect(native).toHaveClass(/svelte-/);
  await expect(child).toHaveClass(/svelte-/);

  const nativeHashes = await scopedHashes(native);
  const childHashes = await scopedHashes(child);

  expect(childHashes).toContain(nativeHashes[0]);
});

test.describe('initial SSR paint', () => {
  test.use({ javaScriptEnabled: false });

  test('literal scoped prop paints the child with the parent styles before hydration', async ({
    page
  }) => {
    await page.goto('/tests/scoped-props');

    const firstCase = page.locator('article.case', { hasText: 'Explicit scoped literal prop' });
    const native = firstCase.locator('.demo-card.parent-owned');
    const child = firstCase.locator('.child-card.parent-owned');

    await expect(native).toHaveClass(/svelte-/);
    await expect(child).toHaveClass(/svelte-/);

    const nativeStyles = await computedPaintStyles(native);
    const childStyles = await computedPaintStyles(child);

    expect(childStyles).toEqual(nativeStyles);
  });
});

test('dynamic ClassValue toggles keep the parent scope hash', async ({ page }) => {
  await page.goto('/tests/scoped-props');

  const dynamicCase = page.locator('article.case', {
    hasText: 'Explicit scoped dynamic ClassValue'
  });
  const child = dynamicCase.locator('.child-card.parent-owned').first();
  const checkbox = dynamicCase.locator('input[type="checkbox"]');
  const nativeHashes = await scopedHashes(dynamicCase.locator('.demo-card.parent-owned'));

  await expect(child).toHaveClass(/dimmed/);
  expect(await scopedHashes(child)).toContain(nativeHashes[0]);

  await checkbox.uncheck();
  await expect(child).not.toHaveClass(/dimmed/);
  expect(await scopedHashes(child)).toContain(nativeHashes[0]);
});

test('SSR output scopes only the explicit scoped child', async ({ page }) => {
  const response = await page.request.get('/tests/scoped-props/ssr-check');
  const result = (await response.json()) as { body: string };
  const body = result.body;
  const nativeHash = body.match(/demo-card parent-owned (svelte-[^"]+)/)?.[1];

  expect(nativeHash).toBeTruthy();
  expect(body).toContain(`child-card parent-owned ${nativeHash}`);
  expect(body).toContain('child-card dimmed');
});

async function scopedHashes(locator: import('@playwright/test').Locator) {
  const className = await locator.getAttribute('class');

  return (className ?? '').split(/\s+/).filter((name) => name.startsWith('svelte-'));
}

async function computedPaintStyles(locator: import('@playwright/test').Locator) {
  return locator.evaluate((element) => {
    const styles = getComputedStyle(element);

    return {
      backgroundColor: styles.backgroundColor,
      borderTopColor: styles.borderTopColor,
      color: styles.color
    };
  });
}
