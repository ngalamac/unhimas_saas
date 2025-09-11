from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Login
        page.goto("http://localhost:5173/#/login")
        page.locator('input[name="email"]').fill("superadmin@test.com")
        page.locator('input[name="password"]').fill("password")
        page.locator('button[type="submit"]').click()

        # Wait for navigation to dashboard
        page.wait_for_url("http://localhost:5173/#/dashboard")

        # Navigate to accounting page
        page.goto("http://localhost:5173/#/accounting")

        # Wait for the page to load
        page.wait_for_selector("text=Accounting Journal")

        # Take screenshot
        page.screenshot(path="jules-scratch/verification/accounting_page.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
