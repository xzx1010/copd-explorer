import { expect, test } from '@playwright/test'

test('navigates between application routes without runtime errors', async ({
  page,
}) => {
  const runtimeErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '基于证据的 COPD 病理学习' }),
  ).toBeVisible()

  await page.getByRole('link', { name: '探索', exact: true }).click()
  await expect(page).toHaveURL(/\/explorer/)
  await expect(
    page.getByRole('heading', { name: '探索病理上下文' }),
  ).toBeFocused()

  await page.goto('/not-a-real-page')
  await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible()
  await page.getByRole('link', { name: '返回首页' }).click()
  await expect(page).toHaveURL('/')

  expect(runtimeErrors).toEqual([])
})

test('full explorer flow: hotspot → slide → annotation → mechanism → clinical', async ({
  page,
}) => {
  // 1. Navigate to explorer with default specimen
  await page.goto('/explorer?anchor=anchor_specimen')

  // Wait for specimen image to load
  const specimenImg = page.getByRole('img', { name: /支气管组织标本/ })
  await specimenImg.waitFor({ state: 'attached' })
  await specimenImg.dispatchEvent('load')

  // 2. Click the "气道狭窄" hotspot
  await page.getByRole('button', { name: '气道狭窄' }).click()

  // URL should update to the annotation anchor
  await expect(page).toHaveURL(/anchor=anchor_annotation_1/)

  // 3. Verify the slide area shows the correct slide
  const slideImg = page.locator('img[alt*="低倍组织学切片"]')
  await slideImg.waitFor({ state: 'attached' })
  await slideImg.dispatchEvent('load')
  await expect(slideImg).toBeVisible()

  // 4. Verify the annotation layer shows the selected marker on the slide
  const annotationMarker = page
    .getByRole('button', {
      name: /气道狭窄.*已选中/,
    })
    .last()
  await expect(annotationMarker).toBeVisible()
  await expect(annotationMarker).toHaveAttribute('aria-pressed', 'true')

  // 5. Verify mechanism section rendered
  await expect(page.getByRole('heading', { name: '机制通路' })).toBeVisible()
  await expect(page.getByText('慢性炎症')).toBeVisible()

  // 6. Verify clinical section rendered
  await expect(page.locator('#clinical-section-title')).toBeVisible()
  await expect(page.getByText('慢性咳痰')).toBeVisible()
})

test('recovers content after page refresh', async ({ page }) => {
  await page.goto('/explorer?anchor=anchor_annotation_2')

  // Verify we are on annotation_2
  await expect(page.locator('img[alt*="高倍气道细节"]')).toBeAttached()

  // Refresh the page
  await page.reload()

  // Content should still resolve to the same anchor
  await expect(page.locator('img[alt*="高倍气道细节"]')).toBeAttached()
})

test('browser back / forward restores correct context', async ({ page }) => {
  // Start at specimen
  await page.goto('/explorer?anchor=anchor_specimen')

  const specimenImg = page.getByRole('img', { name: /支气管组织标本/ })
  await specimenImg.waitFor({ state: 'attached' })
  await specimenImg.dispatchEvent('load')

  // Navigate to annotation_1
  await page.getByRole('button', { name: '气道狭窄' }).click()
  await expect(page).toHaveURL(/anchor=anchor_annotation_1/)
  await expect(page.getByText('慢性炎症')).toBeVisible()

  // Navigate to annotation_2
  await page.getByRole('button', { name: '黏液堵塞' }).click()
  await expect(page).toHaveURL(/anchor=anchor_annotation_2/)
  await expect(page.getByText('气流阻塞')).toBeVisible()

  // Go back → should be at annotation_1
  await page.goBack()
  await expect(page).toHaveURL(/anchor=anchor_annotation_1/)
  await expect(page.getByText('慢性炎症')).toBeVisible()

  // Go forward → should be at annotation_2
  await page.goForward()
  await expect(page).toHaveURL(/anchor=anchor_annotation_2/)
  await expect(page.getByText('气流阻塞')).toBeVisible()

  // Go back twice → back to specimen
  await page.goBack()
  await page.goBack()
  await expect(page).toHaveURL(/anchor=anchor_specimen/)
})

test('invalid anchor shows recovery UI', async ({ page }) => {
  await page.goto('/explorer?anchor=bad!format')

  // Should show the invalid anchor error
  await expect(page.getByText(/不是有效的锚点格式/)).toBeVisible()
  // Should have a retry button
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('rapid hotspot switching does not show stale content', async ({
  page,
}) => {
  await page.goto('/explorer?anchor=anchor_specimen')

  const specimenImg = page.getByRole('img', { name: /支气管组织标本/ })
  await specimenImg.waitFor({ state: 'attached' })
  await specimenImg.dispatchEvent('load')

  // Rapidly click three different hotspots
  const hotspots = ['气道狭窄', '黏液堵塞', '肺泡壁损失']
  for (const name of hotspots) {
    await page.getByRole('button', { name }).click()
    // Don't wait — just fire clicks rapidly
  }

  // Wait for the final state to settle
  await page.waitForTimeout(1000)

  // The last clicked hotspot ("肺泡壁损失") should be selected
  const lastMarker = page
    .getByRole('button', { name: /肺泡壁损失.*已选中/ })
    .last()
  await expect(lastMarker).toBeVisible()

  // Mechanism should match the last selection
  await expect(page.getByText('实质破坏')).toBeVisible()

  // The first hotspot should NOT be selected anymore
  await expect(
    page.getByRole('button', { name: /气道狭窄.*已选中/ }).last(),
  ).not.toBeVisible()
})

test('ai mock analysis: submit case → view report → evidence links', async ({
  page,
}) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.goto('/ai')

  // Fill required form fields
  await page.getByPlaceholder(/65/).fill('65')
  await page.getByRole('combobox').selectOption('男性')
  await page.getByPlaceholder(/40 年/).fill('40 年，每日一包')
  await page.getByPlaceholder(/慢性咳嗽/).fill('慢性咳嗽，咳痰，活动后气促')

  // Submit
  await page.getByRole('button', { name: '提交分析' }).click()

  // Button should be disabled during loading
  await expect(page.getByRole('button', { name: /分析中/ })).toBeDisabled()

  // Wait for the report to render
  await expect(page.getByText('AI 分析报告')).toBeVisible({ timeout: 8000 })

  // All five report sections should exist
  await expect(page.getByRole('heading', { name: '疾病评估' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '病理证据' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '鉴别诊断' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '建议' })).toBeVisible()

  // Evidence links should reference real anchors
  const evidenceLinks = page.getByRole('link', { name: /查看病理证据/ })
  await expect(evidenceLinks.first()).toBeVisible()
  const href = await evidenceLinks.first().getAttribute('href')
  expect(href).toMatch(/\/explorer\?anchor=anchor_annotation_\d&from=ai/)

  // Disclaimer must be visible
  await expect(
    page.getByRole('complementary', { name: '免责声明', exact: true }),
  ).toContainText('教学用途')

  // No runtime errors
  expect(runtimeErrors).toEqual([])

  // Verify no patient data leaked to console errors
  for (const err of runtimeErrors) {
    expect(err).not.toMatch(/65|男性|慢性咳嗽|咳痰|40 年/)
  }
})

test('ai evidence backtrack → explorer → return to report roundtrip', async ({
  page,
}) => {
  await page.goto('/ai')

  // Fill and submit
  await page.getByPlaceholder(/65/).fill('70')
  await page.getByRole('combobox').selectOption('女性')
  await page.getByPlaceholder(/40 年/).fill('无吸烟史')
  await page.getByPlaceholder(/慢性咳嗽/).fill('呼吸困难')
  await page.getByRole('button', { name: '提交分析' }).click()

  // Wait for report
  await expect(page.getByText('AI 分析报告')).toBeVisible({ timeout: 8000 })

  // Click the first evidence link
  const firstLink = page.getByRole('link', { name: /查看病理证据/ }).first()
  await firstLink.click()

  // Should land on explorer with from=ai
  await expect(page).toHaveURL(
    /\/explorer\?anchor=anchor_annotation_\d&from=ai/,
  )
  await expect(page.getByText('来自 AI 分析')).toBeVisible()
  await expect(page.getByRole('link', { name: '返回 AI 分析' })).toBeVisible()

  // Click "返回 AI 分析"
  await page.getByRole('link', { name: '返回 AI 分析' }).click()

  // Should be back on the AI page with the report still visible
  await expect(page).toHaveURL('/ai')
  await expect(page.getByText('AI 分析报告')).toBeVisible()
})
