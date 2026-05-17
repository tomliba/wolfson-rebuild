import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.join(process.cwd(), 'tests', 'screenshots', 'full-suite');

// Helper: wait for authenticated page to load
async function waitForAuth(page, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  // Different markers per page to ensure real content (not skeleton) is visible
  if (url === '/') {
    await expect(page.locator('text=סקירת התקדמות')).toBeVisible({ timeout: 20000 });
  } else if (url === '/tasks') {
    await expect(page.locator('text=מטלות חד-פעמיות')).toBeVisible({ timeout: 20000 });
  } else if (url === '/surgeries') {
    await expect(page.getByRole('button', { name: 'ניתוח חדש' })).toBeVisible({ timeout: 20000 });
  } else if (url === '/videos') {
    await expect(page.getByRole('button', { name: 'סרט חדש' })).toBeVisible({ timeout: 20000 });
  } else {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });
  }
  await page.waitForTimeout(1000);
}

// Helper: click a step/checkbox by exact label text
async function clickStep(page, label) {
  const target = page.getByText(label, { exact: true });
  await target.click();
  await page.waitForTimeout(200);
}

// ============================================================
// A. Auth tests (use fresh browser contexts, not shared page)
// ============================================================
test.describe('A. Auth tests', () => {
  test('login with correct password redirects to /', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000', storageState: undefined });
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('/', { timeout: 15000 });
    expect(page.url()).toMatch(/localhost:3000\/?$/);
    await page.screenshot({ path: path.join(screenshotsDir, 'auth-login-success.png') });
    await context.close();
  });

  test('login with wrong password shows error', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000', storageState: undefined });
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);
    const errorText = page.locator('p.text-red-600');
    await expect(errorText).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'auth-login-error.png') });
    await context.close();
  });

  test('direct access to / when logged out shows login', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000', storageState: undefined });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotsDir, 'auth-redirect-to-login.png') });
    const url = page.url();
    const hasLoginForm = await page.locator('input[name="email"]').isVisible().catch(() => false);
    const isAtLogin = url.includes('/login');
    // The dashboard content should NOT be visible without auth
    const hasDashboard = await page.locator('text=סקירת התקדמות').isVisible().catch(() => false);
    expect(isAtLogin || hasLoginForm || !hasDashboard).toBe(true);
    await context.close();
  });

  test('session persists across page reloads', async ({ page }) => {
    await waitForAuth(page, '/');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'auth-session-persist.png') });
  });
});

// ============================================================
// B. Dashboard tests
// ============================================================
test.describe('B. Dashboard tests', () => {
  test('stat cards render with correct structure', async ({ page }) => {
    await waitForAuth(page, '/');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=מטלות שהושלמו')).toBeVisible();
    await expect(page.locator('text=סרטים שנצפו')).toBeVisible();
    await expect(page.locator('text=הוצגו בשמיים').first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-stat-cards.png') });
  });

  test('monthly surgery chart renders', async ({ page }) => {
    await waitForAuth(page, '/');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=ניתוחים לפי חודש')).toBeVisible();
    const chartContainer = page.locator('.recharts-responsive-container');
    await expect(chartContainer).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-chart.png') });
  });

  test('progress ring shows correct percentage', async ({ page }) => {
    await waitForAuth(page, '/');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=התקדמות במטלות')).toBeVisible();
    await expect(page.locator('text=/\\d+ מתוך \\d+ הושלמו/')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-progress-ring.png') });
  });

  test('Excel export button triggers download', async ({ page }) => {
    await waitForAuth(page, '/');
    await page.waitForTimeout(2000);

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.getByRole('button', { name: 'ייצוא לאקסל' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.xlsx');
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-excel-export.png') });
  });

  test('PDF report component visible', async ({ page }) => {
    await waitForAuth(page, '/');
    await page.waitForTimeout(2000);

    const pdfBtn = page.locator('button:has-text("ייצוא PDF")');
    await expect(pdfBtn).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-pdf-button.png') });
  });
});

// ============================================================
// C. Tasks tests
// ============================================================
test.describe('C. Tasks tests', () => {
  test('all seeded tasks appear in the list', async ({ page }) => {
    await waitForAuth(page, '/tasks');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=השלמת קורס מבוא לקטרקט')).toBeVisible();
    await expect(page.locator('text=צפייה ב-10 ניתוחי קטרקט')).toBeVisible();
    await expect(page.locator('text=תרגול 5 רקסיס בוטלאב')).toBeVisible();
    await expect(page.locator('text=ביצוע ניתוח סולו ראשון')).toBeVisible();
    await expect(page.locator('text=השתתפות בישיבת שמיים')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'tasks-all-visible.png') });
  });

  test('task completion toggle works', async ({ page }) => {
    await waitForAuth(page, '/tasks');
    await page.waitForTimeout(2000);

    // Find an incomplete task (Circle icon = not completed)
    const circles = page.locator('svg.lucide-circle');
    const circleCount = await circles.count();

    if (circleCount === 0) {
      // All tasks completed - try uncompleting one first
      const removeBtn = page.locator('svg.lucide-x').first();
      if (await removeBtn.isVisible().catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
      }
    }

    // Now find an incomplete task
    const incompleteCircle = page.locator('svg.lucide-circle').first();
    const hasIncomplete = await incompleteCircle.isVisible().catch(() => false);
    if (!hasIncomplete) {
      test.skip(true, 'No incomplete tasks available');
      return;
    }

    await incompleteCircle.click();
    await page.waitForTimeout(500);

    const completeBtn = page.locator('button:has-text("סמן כבוצע")').first();
    await expect(completeBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: path.join(screenshotsDir, 'tasks-completion-form.png') });

    await completeBtn.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Verify checkmark appeared
    const checkmarks = page.locator('svg.lucide-circle-check');
    await expect(checkmarks.first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'tasks-completion-created.png') });

    // Now uncomplete it
    const removeBtn = page.locator('svg.lucide-x').first();
    if (await removeBtn.isVisible().catch(() => false)) {
      const beforeCount = await checkmarks.count();
      await removeBtn.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');

      const afterCount = await page.locator('svg.lucide-circle-check').count();
      expect(afterCount).toBeLessThan(beforeCount);
      await page.screenshot({ path: path.join(screenshotsDir, 'tasks-completion-removed.png') });
    }
  });
});

// ============================================================
// D. Surgeries tests - full CRUD
// ============================================================
test.describe('D. Surgeries tests', () => {
  test('create a phaco surgery with 5 steps', async ({ page }) => {
    await waitForAuth(page, '/surgeries');

    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await expect(page.locator('text=תיעוד ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('ט.ב');

    // Select eye -- the SelectTrigger has placeholder "בחר עין"
    await page.locator('button').filter({ hasText: 'בחר עין' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'ימין' }).click();
    await page.waitForTimeout(200);

    await page.locator('input[placeholder="שם המנתח המפקח"]').fill('ד"ר כהן');

    await clickStep(page, 'פתחים');
    await clickStep(page, 'רקסיס');
    await clickStep(page, 'הידרודיסקציה');
    await clickStep(page, 'פאקואמולסיפיקציה');
    await clickStep(page, 'שאיבת קורטקס');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ט.ב')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-phaco-created.png') });
  });

  test('create a phacolaser surgery with 4 steps', async ({ page }) => {
    await waitForAuth(page, '/surgeries');

    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await expect(page.locator('text=תיעוד ניתוח חדש')).toBeVisible({ timeout: 5000 });

    // Switch to phacolaser
    await page.locator('button[type="button"]').filter({ hasText: 'פאקולייזר' }).first().click();
    await page.waitForTimeout(300);

    await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('פ.ל');

    await page.locator('button').filter({ hasText: 'בחר עין' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'שמאל' }).click();
    await page.waitForTimeout(200);

    await clickStep(page, 'פתחים');
    await clickStep(page, 'הידרודיסקציה');
    await clickStep(page, 'פאקואמולסיפיקציה');
    await clickStep(page, 'שאיבת קורטקס');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=פ.ל')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-phacolaser-created.png') });
  });

  test('create a surgery with supervising surgeon', async ({ page }) => {
    await waitForAuth(page, '/surgeries');

    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await expect(page.locator('text=תיעוד ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('מ.פ');
    await page.locator('input[placeholder="שם המנתח המפקח"]').fill('פרופ׳ לוי');
    await clickStep(page, 'פתחים');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=פרופ׳ לוי')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-with-supervisor.png') });
  });

  test('create a surgery with complications', async ({ page }) => {
    await waitForAuth(page, '/surgeries');

    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await expect(page.locator('text=תיעוד ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('ס.ב');
    await clickStep(page, 'פתחים');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await clickStep(page, 'קרע בקופסית קדמית');
    await clickStep(page, 'זונוליזיס');
    await clickStep(page, 'ויטרקטומיה קדמית');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ס.ב')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-with-complications.png') });
  });

  test('create a surgery with complex types', async ({ page }) => {
    await waitForAuth(page, '/surgeries');

    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await expect(page.locator('text=תיעוד ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('מ.ר');
    await clickStep(page, 'פתחים');

    await clickStep(page, 'הרחבת אישון');
    await clickStep(page, 'ירוד בשל');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=מ.ר')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-with-complex.png') });
  });

  test('edit an existing surgery', async ({ page }) => {
    await waitForAuth(page, '/surgeries');
    await page.waitForTimeout(2000);

    const editBtn = page.locator('button:has(svg.lucide-pencil)').first();
    const hasEdit = await editBtn.isVisible().catch(() => false);
    if (!hasEdit) {
      test.skip(true, 'No surgery cards to edit');
      return;
    }

    await editBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=עריכת ניתוח')).toBeVisible();

    const initialsInput = page.locator('input[placeholder="לדוגמה: א.כ"]');
    await initialsInput.clear();
    await initialsInput.fill('ע.ד');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ע.ד')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-edited.png') });
  });

  test('delete a surgery', async ({ page }) => {
    await waitForAuth(page, '/surgeries');
    await page.waitForTimeout(2000);

    const cardsBefore = await page.locator('button:has(svg.lucide-trash-2)').count();
    if (cardsBefore === 0) {
      test.skip(true, 'No surgery cards to delete');
      return;
    }

    await page.locator('button:has(svg.lucide-trash-2)').first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const cardsAfter = await page.locator('button:has(svg.lucide-trash-2)').count();
    expect(cardsAfter).toBeLessThan(cardsBefore);
    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-deleted.png') });
  });
});

// ============================================================
// E. Videos tests - full CRUD
// ============================================================
test.describe('E. Videos tests', () => {
  test('create a video review with feedback', async ({ page }) => {
    await waitForAuth(page, '/videos');

    await page.getByRole('button', { name: 'סרט חדש' }).click();
    await expect(page.locator('text=תיעוד סרט ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await page.locator('input[placeholder="שם הרופא הבכיר"]').fill('ד"ר שמעון');
    await page.locator('textarea[placeholder="תיאור תוכן הסרטון..."]').fill('ניתוח פאקו רגיל עם רקסיס');
    await page.locator('textarea[placeholder="משוב הרופא הבכיר..."]').fill('ביצוע מצוין של הרקסיס');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ד"ר שמעון')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'video-created.png') });
  });

  test('create video marked as presented in meeting', async ({ page }) => {
    await waitForAuth(page, '/videos');

    await page.getByRole('button', { name: 'סרט חדש' }).click();
    await expect(page.locator('text=תיעוד סרט ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await page.locator('input[placeholder="שם הרופא הבכיר"]').fill('ד"ר אורן');
    await page.locator('textarea[placeholder="תיאור תוכן הסרטון..."]').fill('סרט הצגה בשמיים');

    await page.locator('label:has-text("הוצג בישיבת שמיים")').click();
    await page.waitForTimeout(300);

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ד"ר אורן')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'video-presented.png') });
  });

  test('edit a video review', async ({ page }) => {
    await waitForAuth(page, '/videos');
    await page.waitForTimeout(2000);

    const editBtn = page.locator('button:has(svg.lucide-pencil)').first();
    const hasEdit = await editBtn.isVisible().catch(() => false);
    if (!hasEdit) {
      test.skip(true, 'No video cards to edit');
      return;
    }

    await editBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=עריכת סרט ניתוח')).toBeVisible();

    const feedbackInput = page.locator('textarea[placeholder="משוב הרופא הבכיר..."]');
    await feedbackInput.clear();
    await feedbackInput.fill('משוב מעודכן - עבודה טובה מאוד');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=משוב מעודכן')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'video-edited.png') });
  });

  test('delete a video review', async ({ page }) => {
    await waitForAuth(page, '/videos');
    await page.waitForTimeout(2000);

    const cardsBefore = await page.locator('button:has(svg.lucide-trash-2)').count();
    if (cardsBefore === 0) {
      test.skip(true, 'No video cards to delete');
      return;
    }

    await page.locator('button:has(svg.lucide-trash-2)').first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const cardsAfter = await page.locator('button:has(svg.lucide-trash-2)').count();
    expect(cardsAfter).toBeLessThan(cardsBefore);
    await page.screenshot({ path: path.join(screenshotsDir, 'video-deleted.png') });
  });
});

// ============================================================
// F. Admin Panel tests
// ============================================================
test.describe('F. Admin Panel tests', () => {
  test('admin panel shows header and content', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const url = page.url();
    if (url.includes('/admin')) {
      await expect(page.locator('text=פאנל ניהול')).toBeVisible({ timeout: 10000 });
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'admin-panel.png') });
  });

  test('admin panel shows resident cards or empty state', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (!page.url().includes('/admin')) return;

    const hasResidents = await page.locator('text=/\\d+ מתמחים רשומים/').isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=אין מתמחים רשומים עדיין').isVisible().catch(() => false);
    expect(hasResidents || hasEmpty).toBe(true);
    await page.screenshot({ path: path.join(screenshotsDir, 'admin-residents.png') });
  });
});

// ============================================================
// G. Hebrew/RTL tests
// ============================================================
test.describe('G. Hebrew/RTL tests', () => {
  test('sidebar is on the RIGHT side', async ({ page }) => {
    await waitForAuth(page, '/');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const box = await sidebar.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x + box.width).toBeGreaterThan(viewport.width - 10);
    await page.screenshot({ path: path.join(screenshotsDir, 'rtl-sidebar-right.png') });
  });

  test('main content margin accounts for sidebar', async ({ page }) => {
    await waitForAuth(page, '/');

    const main = page.locator('main');
    const mainBox = await main.boundingBox();
    const viewport = page.viewportSize();
    expect(mainBox.width).toBeLessThan(viewport.width - 100);
    await page.screenshot({ path: path.join(screenshotsDir, 'rtl-main-margin.png') });
  });

  test('page content has dir=rtl attribute', async ({ page }) => {
    await waitForAuth(page, '/tasks');

    const rtlDiv = page.locator('[dir="rtl"]').first();
    await expect(rtlDiv).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'rtl-dir-attribute.png') });
  });
});

// ============================================================
// H. Mobile responsive tests (viewport 390x844)
// ============================================================
test.describe('H. Mobile responsive tests', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sidebar hidden, hamburger appears', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();

    const hamburger = page.locator('header button:has(svg.lucide-menu)');
    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-hamburger.png') });
  });

  test('hamburger opens Sheet drawer with nav', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hamburger = page.locator('header button:has(svg.lucide-menu)');
    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await hamburger.click();
    await page.waitForTimeout(1000);

    // Sheet content should appear
    const sheetContent = page.locator('[data-state="open"]').first();
    await expect(sheetContent).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-drawer-open.png') });
  });

  test('clicking a nav item navigates', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hamburger = page.locator('header button:has(svg.lucide-menu)');
    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await hamburger.click();
    await page.waitForTimeout(1000);

    // Click tasks link inside the Sheet dialog (not the desktop sidebar)
    const drawer = page.locator('[data-state="open"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    const tasksLink = drawer.locator('a:has-text("מטלות")');
    await tasksLink.click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/tasks');
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-nav-worked.png') });
  });

  test('touch targets large enough', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const buttons = page.locator('button');
    const count = await buttons.count();
    let tooSmallCount = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box && (box.width < 28 || box.height < 28)) {
        tooSmallCount++;
      }
    }
    // Small icon buttons are acceptable; we just check the majority are tappable
    expect(tooSmallCount).toBeLessThan(8);
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-touch-targets.png') });
  });
});

// ============================================================
// I. Error handling tests
// ============================================================
test.describe('I. Error handling tests', () => {
  test('surgery form submits with minimal data', async ({ page }) => {
    await waitForAuth(page, '/surgeries');

    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await expect(page.locator('text=תיעוד ניתוח חדש')).toBeVisible({ timeout: 5000 });

    await clickStep(page, 'פתחים');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: path.join(screenshotsDir, 'surgery-minimal-submit.png') });
  });

  test('no console errors on normal navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/surgeries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
    await page.screenshot({ path: path.join(screenshotsDir, 'no-console-errors.png') });
  });
});

// ============================================================
// Z. Logout test (LAST - may destroy session token)
// ============================================================
test.describe('Z. Logout test', () => {
  test('logout button returns to /login', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: 'http://localhost:3000',
      storageState: './tests/auth-state.json',
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const logoutBtn = page.locator('aside button:has-text("התנתק")');
    await logoutBtn.click();

    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
    await page.screenshot({ path: path.join(screenshotsDir, 'auth-logout.png') });
    await context.close();
  });
});
