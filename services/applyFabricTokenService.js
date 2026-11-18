
import request from "request";
import config from "../config/config.js";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

const RETRYABLE_ERRORS = new Set([
    "EAI_AGAIN",
    "ETIMEDOUT",
    "ESOCKETTIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
]);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestFabricToken() {
    return new Promise((resolve, reject) => {
        const options = {
            method: "POST",
            url: config.baseUrl + "/payment/v1/token",
            headers: {
                "Content-Type": "application/json",
                "X-APP-Key": config.fabricAppId,
            },
            timeout: 30000,
            body: JSON.stringify({
                appSecret: config.appSecret,
            }),
        };

        request(options, (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }

            if (
                !response ||
                response.statusCode < 200 ||
                response.statusCode >= 300
            ) {
                reject(
                    new Error(
                        `Telebirr token request failed with HTTP ${
                            response?.statusCode ?? "unknown"
                        }`
                    )
                );
                return;
            }

            let result;

            try {
                result = JSON.parse(body);
            } catch {
                reject(
                    new Error(
                        "Telebirr returned an invalid JSON token response"
                    )
                );
                return;
            }

            if (!result.token) {
                reject(
                    new Error(
                        "Telebirr response did not contain a token"
                    )
                );
                return;
            }

            resolve(result);
        });
    });
}

async function applyFabricToken() {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            console.log(
                `Telebirr token request: attempt ${attempt}/${MAX_ATTEMPTS}`
            );

            return await requestFabricToken();
        } catch (error) {
            const code = error.code || "UNKNOWN";

            console.error(
                `Telebirr token request failed (attempt ${attempt}): ${code}`
            );

            if (
                !RETRYABLE_ERRORS.has(code) ||
                attempt === MAX_ATTEMPTS
            ) {
                throw error;
            }

            const delay = RETRY_DELAY_MS * attempt;

            console.log(
                `Retrying Telebirr token request in ${delay}ms`
            );

            await sleep(delay);
        }
    }

    throw new Error(
        "Telebirr token request failed after all attempts"
    );
}

export default applyFabricToken;
