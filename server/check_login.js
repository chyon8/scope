const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.wishket.com/accounts/login/', { waitUntil: 'networkidle2' });
    
    const html = await page.evaluate(() => {
      // Find all inputs in the page to see their name, id, and type
      return Array.from(document.querySelectorAll('input')).map(i => ({
         id: i.id,
         name: i.name,
         type: i.type,
         placeholder: i.placeholder
      }));
    });
    console.log(JSON.stringify(html, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();
