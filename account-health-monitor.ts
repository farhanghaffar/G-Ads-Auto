import { chromium, Page} from 'playwright';
import publishSlackMessage from './helpers/sendSlackMessage';

interface Config {
  primaryAccountId: string;
  backupAccountId: string;
  testCampaignName: string;
  monitoringInterval: number;
  alertTriggers: string[];
}

const config: Config = require('./config.json');
const channelId: string | undefined = process.env.SLACK_CHANNEL_ID || undefined;

function log(message: string) {
  console.log(`[${new Date().toISOString().split('T')[0]}] ${message}`);
}

async function monitorAccountHealth() {
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
    storageState: 'state.json',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'America/New_York'
  });
  const page = await context.newPage();
  try {
    log('🔍 Starting account health check...');
    await page.goto(`https://ads.google.com/aw/campaigns?ocid=${config.primaryAccountId}`, { waitUntil: 'networkidle' });


    // Static wait for by passing human behaiviour

    await page.getByRole('heading', {level: 2}).filter({hasText: 'Campaigns'}).waitFor({state: 'visible'});

    await page.waitForTimeout(3000);

    const selectRows = page.locator('[aria-label="Select all rows"]');
    await selectRows.waitFor({state: 'visible'});
    await selectRows.click();
    
    await page.waitForTimeout(3000);

    const bulkEdit = page.locator('[aria-label="Bulk edit"]');
    await bulkEdit.waitFor({state: 'visible'});
    await bulkEdit.click();

    await page.waitForTimeout(3000);

    const copy = page.locator('[aria-label="Copy"]');
    await copy.waitFor({state: 'visible'});
    await copy.click();


    // Campaigns are copied now

    
    // await page.pause();
   
    const alertText = (await page.textContent('[role="alert"], [class*="banner"], [class*="warning"], [class*="red-bar"]') || '').toLowerCase();
    const alertType = config.alertTriggers.find(trigger => alertText.includes(trigger.toLowerCase()));
    if (!alertType) {
      log('✅ Account status: Healthy');
      return;
    }
    log(`⚠️ ALERT DETECTED: ${alertType}`);
    await publishSlackMessage(channelId!, `Account has following alert message: ${alertType}`);

    log('🔄 Initiating campaign backup...');
    await backupCampaign(page);
    log('✅ Backup completed successfully');
  } catch (error) {
    console.error(`Error: ${error}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    scheduleNextCheck();
  }
}

async function backupCampaign(page: Page) {
  await page.waitForSelector(`text=${config.testCampaignName}`, { timeout: 30000 });
  await page.click(`text=${config.testCampaignName}`);
  await page.click('[aria-label="More"], [data-testid="more-actions"]');
  await page.click('text=Copy');
  log(`📋 Backing up campaign: ${config.testCampaignName}`);
  await page.goto(`https://ads.google.com/aw/campaigns?ocid=${config.backupAccountId}`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Control+V');
  await page.waitForSelector('text=successfully', { timeout: 30000 });
}

function scheduleNextCheck() {
  const nextCheckMs = config.monitoringInterval * 24 * 60 * 60 * 1000;
  log(`⏰ Next health check in ${config.monitoringInterval} days`);
  setTimeout(monitorAccountHealth, nextCheckMs);
}

monitorAccountHealth().catch(console.error);