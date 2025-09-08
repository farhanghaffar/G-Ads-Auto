import { chromium } from 'playwright';

async function setupLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome', // Use actual Chrome instead of Chromium
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    // Use persistent browser profile
    storageState: undefined // Don't load existing state during setup
  });
  const page = await context.newPage();
  await page.goto('https://accounts.google.com/signin');
  console.log('Log in manually to your Google account with access to Google Ads.');
  console.log('Complete any CAPTCHA or 2FA, then navigate to https://ads.google.com to ensure accounts are loaded.');
  console.log('Press Enter in this console to save the session state.');
  await new Promise(resolve => process.stdin.once('data', resolve));
  await context.storageState({ path: 'state.json' });
  console.log('✅ Session saved to state.json');
  await browser.close();
}

setupLogin().catch(console.error);