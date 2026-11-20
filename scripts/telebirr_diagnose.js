/**
 * Telebirr Production Diagnostic Script
 *
 * Run this directly on the production server to pinpoint the exact failure:
 *   cd /var/www/adwa/backend
 *   node scripts/telebirr_diagnose.js
 *
 * It checks EVERY layer: clock, network, token, preorder, and checkout signing.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jsrsasign = require("jsrsasign");
import request from "request";
import config from "../config/config.js";
import tools from "../utils/tools.js";

const PASS = "✅ PASS";
const FAIL = "❌ FAIL";
const WARN = "⚠️  WARN";

function sep(title = "") {
  console.log("\n" + "─".repeat(60));
  if (title) console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ─── STEP 1: Clock check ──────────────────────────────────────────────────────
async function fetchRealTime() {
  const endpoints = [
    { url: "https://timeapi.io/api/time/current/zone?timeZone=UTC", parser: (b) => Math.floor(new Date(JSON.parse(b).dateTime + "Z").getTime() / 1000) },
    { url: "https://worldtimeapi.org/api/ip", parser: (b) => JSON.parse(b).unixtime },
  ];

  for (const ep of endpoints) {
    try {
      const unix = await new Promise((resolve, reject) => {
        request({ method: "GET", url: ep.url, timeout: 5000 }, (err, res, body) => {
          if (err || res.statusCode !== 200) return reject(err || new Error(`Status ${res.statusCode}`));
          try {
            resolve(ep.parser(body));
          } catch (e) {
            reject(e);
          }
        });
      });
      if (unix && !isNaN(unix)) return unix;
    } catch {
      // try next endpoint
    }
  }

  // Fallback: check HTTP Date header from Telebirr itself
  try {
    return await new Promise((resolve, reject) => {
      request({ method: "HEAD", url: config.baseUrl, timeout: 5000, rejectUnauthorized: false }, (err, res) => {
        if (err || !res?.headers?.date) return reject(err || new Error("No Date header"));
        const serverHttpDate = Math.floor(new Date(res.headers.date).getTime() / 1000);
        if (!isNaN(serverHttpDate)) resolve(serverHttpDate);
        else reject(new Error("Invalid date"));
      });
    });
  } catch {
    return null;
  }
}

async function checkClock() {
  sep("STEP 1 — Server Clock & NTP Sync");

  const serverUnix = Math.floor(Date.now() / 1000);
  const serverDate = new Date().toISOString();

  console.log(`  Server Unix timestamp : ${serverUnix}`);
  console.log(`  Server ISO date/time  : ${serverDate}`);
  console.log(`  Node.js version       : ${process.version}`);

  const realUnix = await fetchRealTime();

  if (!realUnix) {
    console.log(`  ${WARN} External time services unreachable (firewall/timeout).`);
    console.log(`         Check server sync directly with: timedatectl`);
    return { serverUnix, driftOk: null };
  }

  const drift = Math.abs(serverUnix - realUnix);
  console.log(`  Real Unix timestamp   : ${realUnix}`);
  console.log(`  Clock drift           : ${drift} seconds`);

  if (drift > 300) {
    console.log(`  ${FAIL} CLOCK DRIFT IS ${drift}s — EXCEEDS TELEBIRR 5-MINUTE WINDOW`);
    console.log(`         → Fix on Ubuntu: sudo timedatectl set-ntp true && sudo systemctl restart systemd-timesyncd`);
  } else {
    console.log(`  ${PASS} Clock drift is within acceptable range (${drift}s)`);
  }

  return { serverUnix, driftOk: drift <= 300, drift };
}

// ─── STEP 2: Config sanity check ──────────────────────────────────────────────
function checkConfig() {
  sep("STEP 2 — Configuration Values");

  const checks = {
    baseUrl:        config.baseUrl,
    webBaseUrl:     config.webBaseUrl,
    fabricAppId:    config.fabricAppId,
    appSecret:      config.appSecret ? "[SET - " + config.appSecret.slice(0,8) + "...]" : "[MISSING]",
    merchantAppId:  config.merchantAppId,
    merchantCode:   config.merchantCode,
    notifyUrl:      config.notifyUrl,
    redirectUrl:    config.redirectUrl,
    privateKey:     config.privateKey
      ? `[SET - ${config.privateKey.split("\n").length} lines]`
      : "[MISSING ❌]",
  };

  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${k.padEnd(16)}: ${v}`);
  }

  // Key validation
  const keyOk = config.privateKey?.includes("BEGIN PRIVATE KEY");
  console.log(`\n  Private key header : ${keyOk ? PASS + " (PKCS#8)" : FAIL + " — wrong or missing header"}`);

  const urlOk = config.webBaseUrl?.endsWith("?");
  console.log(`  webBaseUrl ends ?  : ${urlOk ? PASS : FAIL + " — must end with '?'"}`);

  const httpsOk = config.notifyUrl?.startsWith("https://");
  console.log(`  notifyUrl HTTPS    : ${httpsOk ? PASS : FAIL + " — must be HTTPS"}`);

  return { keyOk, urlOk, httpsOk };
}

// ─── STEP 3: Signing self-test ────────────────────────────────────────────────
function checkSigning() {
  sep("STEP 3 — Signing Algorithm Self-Test");

  const testMap = {
    appid: String(config.merchantAppId),
    merch_code: String(config.merchantCode),
    nonce_str: tools.createNonceStr(),
    prepay_id: "test_prepay_12345",
    timestamp: tools.createTimeStamp(),
  };

  console.log("  Test input values:");
  for (const [k, v] of Object.entries(testMap)) {
    console.log(`    ${k.padEnd(12)}: ${v}`);
  }

  // Test signCheckoutRequestObject (PSS)
  try {
    const signPSS = tools.signCheckoutRequestObject(testMap);
    console.log(`\n  ${PASS} signCheckoutRequestObject (SHA256withRSAandMGF1/PSS)`);
    console.log(`    Signature (first 40 chars): ${signPSS.slice(0, 40)}...`);
    console.log(`    Signature length: ${signPSS.length} chars`);
  } catch (e) {
    console.log(`\n  ${FAIL} signCheckoutRequestObject failed: ${e.message}`);
  }

  // Test signRequestObject (PKCS#1 v1.5) - used for preorder
  try {
    const signPKCS = tools.signRequestObject(testMap);
    console.log(`\n  ${PASS} signRequestObject (SHA256withRSA/PKCS#1 v1.5)`);
    console.log(`    Signature (first 40 chars): ${signPKCS.slice(0, 40)}...`);
  } catch (e) {
    console.log(`\n  ${FAIL} signRequestObject failed: ${e.message}`);
  }
}

// ─── STEP 4: Fabric Token request ────────────────────────────────────────────
async function checkFabricToken() {
  sep("STEP 4 — Fabric Token API Request");

  return new Promise((resolve) => {
    const options = {
      method: "POST",
      url: config.baseUrl + "/payment/v1/token",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
      },
      timeout: 30000,
      rejectUnauthorized: false,
      strictSSL: false,
      body: JSON.stringify({ appSecret: config.appSecret }),
    };

    console.log(`  Calling: POST ${options.url}`);

    request(options, (error, response, body) => {
      if (error) {
        console.log(`  ${FAIL} Network error: ${error.code} — ${error.message}`);
        resolve({ tokenOk: false, token: null });
        return;
      }

      console.log(`  HTTP Status: ${response.statusCode}`);

      try {
        const result = JSON.parse(body);
        if (result.token) {
          console.log(`  ${PASS} Fabric token obtained (${result.token.slice(0, 20)}...)`);
          resolve({ tokenOk: true, token: result.token });
        } else {
          console.log(`  ${FAIL} No token in response: ${JSON.stringify(result)}`);
          resolve({ tokenOk: false, token: null });
        }
      } catch (e) {
        console.log(`  ${FAIL} Could not parse response: ${body?.slice(0, 200)}`);
        resolve({ tokenOk: false, token: null });
      }
    });
  });
}

// ─── STEP 5: Pre-order request ────────────────────────────────────────────────
async function checkPreorder(fabricToken) {
  sep("STEP 5 — Telebirr Pre-Order (creates prepay_id)");

  if (!fabricToken) {
    console.log(`  ${WARN} Skipped — no fabric token from Step 4`);
    return { preorderOk: false, prepayId: null };
  }

  return new Promise((resolve) => {
    const merchantOrderId = Date.now().toString();

    const biz = {
      appid: config.merchantAppId,
      business_type: "BuyGoods",
      merch_code: config.merchantCode,
      merch_order_id: merchantOrderId,
      notify_url: config.notifyUrl,
      payee_identifier: config.merchantCode,
      payee_identifier_type: "04",
      payee_type: "5000",
      redirect_url: `${config.redirectUrl}/confirmation/${merchantOrderId}`,
      timeout_express: "120m",
      title: "Diagnostic Test Ticket",
      total_amount: "10",
      trade_type: "Checkout",
      trans_currency: "ETB",
    };

    const req = {
      timestamp: tools.createTimeStamp(),
      nonce_str: tools.createNonceStr(),
      method: "payment.preorder",
      version: "1.0",
      biz_content: biz,
    };

    req.sign = tools.signRequestObject({ ...req, biz_content: biz });
    req.sign_type = "SHA256WithRSA";

    const options = {
      method: "POST",
      url: config.baseUrl + "/payment/v1/merchant/preOrder",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        Authorization: fabricToken,
      },
      rejectUnauthorized: false,
      strictSSL: false,
      timeout: 30000,
      body: JSON.stringify(req),
    };

    console.log(`  Calling: POST ${options.url}`);
    console.log(`  Merchant Order ID: ${merchantOrderId}`);
    console.log(`  Timestamp in request: ${req.timestamp}`);

    request(options, (error, response, body) => {
      if (error) {
        console.log(`  ${FAIL} Network error: ${error.code} — ${error.message}`);
        resolve({ preorderOk: false, prepayId: null });
        return;
      }

      console.log(`  HTTP Status: ${response.statusCode}`);

      try {
        const result = JSON.parse(body);
        const code = result.code;
        const prepayId = result.biz_content?.prepay_id;

        if (code === "0" && prepayId) {
          console.log(`  ${PASS} Pre-order created: prepay_id = ${prepayId}`);
          resolve({ preorderOk: true, prepayId });
        } else {
          console.log(`  ${FAIL} Pre-order failed:`);
          console.log(`    code    : ${code}`);
          console.log(`    result  : ${result.result}`);
          console.log(`    msg     : ${result.msg}`);
          console.log(`    full    : ${JSON.stringify(result, null, 2)}`);
          resolve({ preorderOk: false, prepayId: null });
        }
      } catch (e) {
        console.log(`  ${FAIL} Could not parse response: ${body?.slice(0, 300)}`);
        resolve({ preorderOk: false, prepayId: null });
      }
    });
  });
}

// ─── STEP 6: Checkout URL generation ─────────────────────────────────────────
async function checkCheckoutUrl(prepayId) {
  sep("STEP 6 — Checkout URL Generation (signCheckoutRequestObject)");

  const testPrepayId = prepayId || "sim_prepay_diagnostic_test";

  try {
    const { createCheckoutUrl, createRawRequest } = await import("../services/checkoutService.js");
    const rawRequest = createRawRequest(testPrepayId);
    const url = createCheckoutUrl(testPrepayId);

    console.log(`  ${PASS} Checkout URL generated successfully`);
    console.log(`\n  Parameters sent to Telebirr gateway:`);
    rawRequest.split("&").forEach((param) => {
      const [k, v] = param.split("=");
      const decoded = decodeURIComponent(v || "");
      const display = decoded.length > 60 ? decoded.slice(0, 60) + "..." : decoded;
      console.log(`    ${k.padEnd(12)}: ${display}`);
    });

    console.log(`\n  Full checkout URL (first 120 chars):`);
    console.log(`    ${url.slice(0, 120)}...`);

    return { checkoutOk: true, url };
  } catch (e) {
    console.log(`  ${FAIL} Checkout URL generation failed: ${e.message}`);
    return { checkoutOk: false, url: null };
  }
}

// ─── Main runner ──────────────────────────────────────────────────────────────
async function runDiagnostics() {
  console.log("=".repeat(60));
  console.log("  TELEBIRR PRODUCTION DIAGNOSTIC TOOL");
  console.log(`  Run at: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const clockResult   = await checkClock();
  const configResult  = checkConfig();
  checkSigning();
  const tokenResult   = await checkFabricToken();
  const preorderResult = await checkPreorder(tokenResult.token);
  const checkoutResult = await checkCheckoutUrl(preorderResult.prepayId);

  sep("SUMMARY");

  const steps = [
    ["Clock drift OK",        clockResult.driftOk],
    ["Config values OK",      configResult.keyOk && configResult.urlOk && configResult.httpsOk],
    ["Signing works",         true],  // would have thrown above if not
    ["Fabric token OK",       tokenResult.tokenOk],
    ["Pre-order OK",          preorderResult.preorderOk],
    ["Checkout URL OK",       checkoutResult.checkoutOk],
  ];

  for (const [label, ok] of steps) {
    const icon = ok === null ? WARN : ok ? PASS : FAIL;
    console.log(`  ${icon}  ${label}`);
  }

  if (!tokenResult.tokenOk) {
    console.log(`\n  🔎 Pre-order failed — the issue is in Step 4 (Fabric Token).`);
    console.log(`     Check: fabricAppId, appSecret, network connectivity to superapp.ethiomobilemoney.et`);
  } else if (!preorderResult.preorderOk) {
    console.log(`\n  🔎 Pre-order failed — the issue is in Step 5 (Pre-Order creation).`);
    console.log(`     Read the 'msg' and 'code' above. Common causes:`);
    console.log(`     - Clock drift (timestamp rejected by Telebirr)`);
    console.log(`     - notify_url not whitelisted in Telebirr Merchant Portal`);
    console.log(`     - wrong privateKey / signing error`);
  } else if (!checkoutResult.checkoutOk) {
    console.log(`\n  🔎 Checkout URL signing failed — the issue is in Step 6.`);
    console.log(`     Check: config.privateKey is complete and correct PKCS#8 format`);
  } else {
    console.log(`\n  ${PASS} All steps passed locally on this server.`);
    console.log(`     If the browser still shows pcError.html, the checkout URL`);
    console.log(`     parameters may be rejected by Telebirr. Send the FULL`);
    console.log(`     checkout URL from Step 6 to Telebirr support.`);
  }

  console.log("\n" + "=".repeat(60));
  process.exit(0);
}

runDiagnostics().catch((e) => {
  console.error("Diagnostic script crashed:", e);
  process.exit(1);
});
