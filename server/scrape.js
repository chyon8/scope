const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    console.log("Navigating to login page...");
    await page.goto('https://www.wishket.com/accounts/login/', { waitUntil: 'networkidle2' });
    
    console.log("Typing credentials...");
    const idSelector = 'input[name="emailOrId"]';
    const pwSelector = 'input[name="password"]';
    
    await page.waitForSelector(idSelector, { timeout: 5000 });
    await page.type(idSelector, 'sangmin@wishket.com');
    await page.type(pwSelector, 'qwer1234');
    
    console.log("Submitting login...");
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    console.log("Login submitted. Navigating to target URL...");
    const targetUrl = 'https://www.wishket.com/manage/project/inspection/detail/156594/task/';
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    
    console.log("Wait for page to load content...");
    await new Promise(r => setTimeout(r, 2000)); // manual wait
    
    console.log("Extracting page data...");
    
    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, .title, .content, .desc, .memo, p, span'));
      // Collect some structural information
      const uniqueTexts = new Set();
      const overview = elements
          .filter(el => {
              const text = el.innerText.trim();
              if (text.length < 5 || uniqueTexts.has(text)) return false;
              uniqueTexts.add(text);
              return true;
          })
          .map(el => ({ tag: el.tagName, class: el.className, text: el.innerText.substring(0, 100).replace(/\n/g, ' ') }))
          .slice(0, 50);
          
      return { bodyText: bodyText.substring(0, 4000), overview };
    });
    
    fs.writeFileSync('scraped_data.json', JSON.stringify(data, null, 2));
    console.log("Successfully wrote scraped_data.json");
    
  } catch (error) {
    console.error("Error occurred:", error);
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
    console.log("Saved error_screenshot.png");
  } finally {
    await browser.close();
  }
})();
