import request from "request";
import applyFabricToken from "./applyFabricTokenService.js";
import tools from "../utils/tools.js";
import config from "../config/config.js";

/**
 * Request to query order with TeleBirr
 */
function requestQueryOrder(fabricToken, merchantOrderId) {
    return new Promise((resolve, reject) => {
        // Build biz_content object
        const biz = {
            appid: config.merchantAppId,
            merch_code: config.merchantCode,
            merch_order_id: merchantOrderId,
        };

        // Build request object
        const req = {
            timestamp: tools.createTimeStamp(),
            nonce_str: tools.createNonceStr(),
            method: "payment.queryorder",
            version: "1.0",
            biz_content: biz
        };

        // Generate signature
        const reqForSign = {
            ...req,
            biz_content: biz
        };
        req.sign = tools.signRequestObject(reqForSign);
        req.sign_type = "SHA256WithRSA";

        const options = {
            method: "POST",
            url: config.baseUrl + "/payment/v1/merchant/queryOrder",
            headers: {
                "Content-Type": "application/json",
                "X-APP-Key": config.fabricAppId,
                Authorization: fabricToken,
            },
            rejectUnauthorized: false,
            requestCert: false,
            agent: false,
            strictSSL: false,
            timeout: 30000,
            body: JSON.stringify(req),
        };

        console.log("=== Querying Order ===");
        console.log("Request Object:", JSON.stringify(req, null, 2));

        request(options, function (error, response) {
            if (error) {
                console.error("❌ Error querying order:", error);
                reject(error);
                return;
            }

            try {
                console.log("Response Status Code:", response.statusCode);
                const result = JSON.parse(response.body);
                console.log("✅ Query Order Response:", JSON.stringify(result, null, 2));

                if (result.code === "0" && result.result === "SUCCESS") {
                    resolve(result);
                } else {
                    const errorMsg = result.msg || result.errorMsg || "Unknown error";
                    const errorCode = result.code || result.errorCode || "Unknown";
                    reject(new Error(`Order query failed (Code: ${errorCode}): ${errorMsg}`));
                }
            } catch (parseError) {
                console.error("❌ Error parsing response:", parseError);
                console.error("Response body:", response.body);
                reject(parseError);
            }
        });
    });
}

/**
 * Main function to query order
 */
export async function queryOrder(merchantOrderId) {
    try {
        if (!merchantOrderId) {
            throw new Error("Merchant Order ID is required");
        }

        // Step 1: Get fabric token
        console.log("📝 Step 1: Getting fabric token for query...");
        const tokenResult = await applyFabricToken();
        const fabricToken = tokenResult.token;

        // Step 2: Query order
        console.log("📝 Step 2: Querying order status...");
        const queryResult = await requestQueryOrder(fabricToken, merchantOrderId);

        return {
            success: true,
            orderStatus: queryResult.biz_content.order_status,
            tradeStatus: queryResult.biz_content.trade_status,
            paymentOrderId: queryResult.biz_content.payment_order_id,
            totalAmount: queryResult.biz_content.total_amount,
            transTime: queryResult.biz_content.trans_time,
            fullResponse: queryResult
        };
    } catch (error) {
        console.error("❌ Error in queryOrder service:", error);
        throw error;
    }
}

export default {
    queryOrder
};

