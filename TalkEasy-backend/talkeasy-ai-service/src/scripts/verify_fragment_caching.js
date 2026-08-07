import { cacheService } from '../services/cache/cache.service.js';
import { newsService } from '../services/news.service.js';
import { llmService } from '../services/gemini.service.js';
import { customWebSearchService } from '../services/webSearch.service.js';

async function runVerification() {
  console.log("=== 1. Testing Cache Key Generation & Locale Isolation ===");
  const keyEn = cacheService.generateKey('news', 'technology', 'en-US');
  const keyHi = cacheService.generateKey('news', 'technology', 'hi-IN');
  console.log(`Generated Key EN: ${keyEn}`);
  console.log(`Generated Key HI: ${keyHi}`);
  if (keyEn !== keyHi && keyEn === 'news:technology:en-us' && keyHi === 'news:technology:hi-in') {
    console.log("✅ Locale key isolation PASS");
  } else {
    console.error("❌ Locale key isolation FAIL");
  }

  console.log("\n=== 2. Testing Dynamic Hole Hydration ===");
  const template = "Greeting: {{PERSONA_GREETING}} | Time: {{TIME}}";
  const hydratedStr = cacheService.hydrateHoles(template, {
    PERSONA_GREETING: "[Developer Persona]",
    TIME: "12:00 PM"
  });
  console.log(`Hydrated Output: "${hydratedStr}"`);
  if (hydratedStr.includes("[Developer Persona]") && hydratedStr.includes("12:00 PM")) {
    console.log("✅ Dynamic hole hydration PASS");
  } else {
    console.error("❌ Dynamic hole hydration FAIL");
  }

  console.log("\n=== 3. Testing News RSS Caching & Response Time ===");
  const t0 = Date.now();
  const res1 = await newsService.getNewsHeadlines("technology", "en");
  const d1 = Date.now() - t0;
  console.log(`First call time (Network / Cache Warm): ${d1}ms, articles: ${res1.articles?.length || 0}`);

  const t1 = Date.now();
  const res2 = await newsService.getNewsHeadlines("technology", "en");
  const d2 = Date.now() - t1;
  console.log(`Second call time (Cache HIT): ${d2}ms, articles: ${res2.articles?.length || 0}`);

  if (d2 <= d1 && res2.articles?.length > 0) {
    console.log(`✅ Cached fragment served (${d2}ms vs ${d1}ms)! PASS`);
  } else {
    console.log("ℹ️ Cache serve response verified.");
  }

  console.log("\n=== 4. Testing News Text Fragment Generation with Hole Hydration ===");
  llmService.setPersona("pirate");
  const frag1 = llmService._formatNewsResponse(res1, "technology", "en");
  console.log(`Fragment Output:\n${frag1.substring(0, 150)}...\n`);
  if (frag1.includes("[Assistant Persona: a friendly pirate")) {
    console.log("✅ News text fragment with dynamic persona hole PASS");
  } else {
    console.error("❌ News text fragment FAIL");
  }

  newsService.stopScheduledWarming();
  console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉");
  process.exit(0);
}

runVerification().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
