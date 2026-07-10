import os
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright


def run():
    print("Initializing Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a widescreen context
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        screenshots_dir = "screenshots"
        os.makedirs(screenshots_dir, exist_ok=True)

        # 1. Capture Homepage
        print("Navigating to Public Homepage http://localhost:4200/ ...")
        try:
            page.goto("http://localhost:4200/", timeout=15000)
            page.wait_for_timeout(3000)  # Wait for animations/load
            page.screenshot(path=os.path.join(screenshots_dir, "homepage.png"))
            print("✓ Saved homepage.png")
            
            # Scroll down to Holidays Section
            print("Scrolling to Holidays Calendar...")
            page.evaluate("window.scrollTo(0, 2200)")
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(screenshots_dir, "homepage_holidays.png"))
            print("✓ Saved homepage_holidays.png")
        except Exception as e:
            print(f"❌ Failed to capture homepage: {e}")

        # 2. Login to Admin
        print("Navigating to Login Page...")
        try:
            page.goto("http://localhost:4200/admin/login", timeout=15000)
            page.wait_for_timeout(1000)
            
            page.fill("input[type='email']", "admin@school.com")
            page.fill("input[type='password']", "Admin@123")
            
            print("Clicking Sign In...")
            page.click("button[type='submit']")
            page.wait_for_url("**/admin/dashboard", timeout=10000)
            page.wait_for_timeout(3000)
            
            # Capture Dashboard Analytics
            page.screenshot(path=os.path.join(screenshots_dir, "dashboard_analytics.png"))
            print("✓ Saved dashboard_analytics.png")
            
            # Click Admissions tab
            print("Navigating to Student Admissions tab...")
            page.click("text=Student Admissions")
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(screenshots_dir, "dashboard_admissions.png"))
            print("✓ Saved dashboard_admissions.png")

            # Click View ID Badge (first approved student)
            print("Clicking View ID Badge...")
            badge_buttons = page.locator("text=View ID Badge")
            if badge_buttons.count() > 0:
                badge_buttons.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path=os.path.join(screenshots_dir, "id_badge_modal.png"))
                print("✓ Saved id_badge_modal.png")
                # Close modal
                page.click("text=❌ Close")
                page.wait_for_timeout(1000)
            else:
                print("⚠️ No View ID Badge button found.")

            # Click School Holidays tab
            print("Navigating to School Holidays tab...")
            page.click("text=School Holidays")
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(screenshots_dir, "dashboard_holidays.png"))
            print("✓ Saved dashboard_holidays.png")

            # Click Kid Attendance tab
            print("Navigating to Attendance / Class Roster tab...")
            page.click("text=Kid Attendance")
            page.wait_for_timeout(2000)
            page.click("text=Class Roster")
            page.wait_for_timeout(1000)
            
            # Click Class Promotion Certificate
            print("Opening Class Promotion Certificate...")
            promo_buttons = page.locator("text=Promotion Cert")
            if promo_buttons.count() > 0:
                promo_buttons.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path=os.path.join(screenshots_dir, "promotion_certificate.png"))
                print("✓ Saved promotion_certificate.png")
                # Close modal
                page.click("button:has-text('×')")
                page.wait_for_timeout(1000)
            else:
                print("⚠️ No Promotion Cert button found.")

            # Click Print TC
            print("Opening Transfer Certificate...")
            tc_buttons = page.locator("text=Print TC")
            if tc_buttons.count() > 0:
                tc_buttons.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path=os.path.join(screenshots_dir, "transfer_certificate.png"))
                print("✓ Saved transfer_certificate.png")
                # Close modal
                page.click("button:has-text('×')")
                page.wait_for_timeout(1000)
            else:
                print("⚠️ No Print TC button found.")
                
        except Exception as e:
            print(f"❌ Failed to capture admin views: {e}")

        browser.close()
        print("Playwright run complete.")

if __name__ == "__main__":
    run()
