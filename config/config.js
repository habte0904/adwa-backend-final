const config = {
    // Base URLs
    baseUrl: "https://superapp.ethiomobilemoney.et:38443/apiaccess/payment/gateway",
    webBaseUrl: "https://superapp.ethiomobilemoney.et:38443/payment/web/paygate?",

    // Production URLs (commented out for testing)
    // baseUrl: "https://telebirrappcube.ethiomobilemoney.et:38443/apiaccess/payment/gateway",
    // webBaseUrl: "https://telebirrappcube.ethiomobilemoney.et:38443/payment/web/paygate?",

    // Credentials
    fabricAppId: "0474bc78-89e0-4e31-ab69-cb03485feead",
    appSecret: "6e4984362d00e5992b731231e9c5245c",
    merchantAppId: "1623855554483208",
    merchantCode: "59955",

    // Private Key for signing
    // NOTE: Key body is PKCS#8 encoded (MIIEvgIBADANBgkq... prefix indicates PKCS#8)
    // so it MUST use 'BEGIN PRIVATE KEY' headers, not 'BEGIN RSA PRIVATE KEY'
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCUaomjRWs+4/Oh
ybYxc0ILzP8qCx9+pnyc5w+YVyP8Z8Yg9qeyot3EJT/twBJ2KTIvzPFeSAAqWHXb
gtsfNu1qaIMeEEoWj5f+2qkm1BhUCOrY2UyG+YnLMHR9UhQEerAYy8SlkSFd2/zg
EzaEBTxEgfyJPu+gcVwSPFSNFX9+Xs1EfEAOcE6h14iHh9S49V7QdccCfP85iIrm
L2h1bLDYlilwMhWjOEbwU7PCxpjunBXtym0gLSOY3KrbRP9SUYL/IDB1pJdw87cu
EqrgfbaqQroxysF89u7T0For0Bmkefdc+sSy74hqHGhhXC7qiAsE47uz/TOlbZKC
5wLZdtsPAgMBAAECggEAC2ZrkBkC9d+4lRLTZdT+m71xVB9qmeXb6IlvDzqSTw8B
jwKjOvt7oVdjI7X/NQhRDI7nc2CAcsA8vVG91xX3ApdoiuShbD43ZKITICJmg/3z
XBjE4hFE3lCogf/N/dIWuLDeOAF/2J/POr7/DwD/8hsx9LDa4y4R7myn6fZexqwP
jALRRFLNX7iCdRhZwtio88S5qrK7NUikha2dXB/nGCITlwe11OOiG8CZdU80AouE
ryfA82V8EFgFBwtS4Xq9i0FiBlchcy47E6QknJ4c0OA6idhB3zGWiEVzfloeG0dq
wog/4lJsn8YjeGuWvSIu0lmfuw4QjN8rsVbFTMaogQKBgQDLDrqpMVICL/sIZb+x
slqBiqmBpvHPSsdauMv3LfyxwWvAy6YoXYvWOAtYtlrwV/whv4BMyQPacvV6dV4G
reiC7v/kJrgRdBrTXli+qbXdvXVpM9ahyrkFwHYAN+i3/WNX5MgK1KiPWYlEwLDN
t9MvjScd3V+rY8+d03F6V9fsbwKBgQC7HLeoms0Mi5l3M6QwshBZB6umuMpATpJP
fLbKY4vnfgj19gzzciW6SUhlU2EdkNn3gMC2gVkdujCNgkLRV4myw8w4y1sxWbkk
z0Hk2jBusPHB/H09umfuEQO1Mfc5gjFEv4vNKe6+XnHRNyTcvK2JXKjhiqZMm4qa
PZ+1sBqLYQKBgDXPLmndlwTbYCOmivj08YT4kNi5u8SZ5WBGLk7PUfJs9jf9/4cc
2wymh2M317tvJXJwA/jVH/9IjYKpDYSpmz7vRMJZ/FcrtFwk2VGVOYuMREvfn9X6
GbPLf7mpFzOCo0vMZbJxDkYGjRi6E2BAgWdNeXsxicOqTH9fY+fu1VpjAoGBAKnR
rn4/wMoaCPa+z83CTkP/SjLOlAE5TmEF94BISLmZEdjpr2djugoQaLxNqF6FEM4o
9L6vNopcaaSFDM+iez7bpYYGSoXHwNk/obZqsHpF7aT521Ei1SCkIJFa/94Z401Z
6zARVrVAUlxnh/Uu6PE6P6wzgisVH/5M356ubekBAoGAHp8znmeb3ffMKPtoKL4J
08jhGPz7aIJKE9imxCqA0uAmtiFtciu1oTrDRdriwgKPTBupg9hNtqj3jA67o/R6
EK9p2QBEyUZ64AIOXmT3eq69QkvyrHyUGxf+wVKSDSXKxFa4DWEsngeuHRly1zV9
Is98niPM7bHyrzeFD+qsfdI=
-----END PRIVATE KEY-----`,

    // Other parameters
    otherParams: "&version=1.0&trade_type=Checkout",

    // Callback URLs 
     //notifyUrl: "http://102.218.2.48:8080/api/telebirr/notify",
    notifyUrl: "https://adwavictorymemorial.gov.et/api/telebirr/notify",
    redirectUrl: "https://adwavictorymemorial.gov.et",
    //redirectUrl: "https://102.218.2.48",
    eventRedirectUrl: "https://adwavictorymemorial.gov.et",
    //eventRedirectUrl: "https://102.218.2.48",
    //eventNotifyUrl: "http://102.218.2.48:8080/api/event/telebirr/notify",
    eventNotifyUrl: "https://adwavictorymemorial.gov.et/api/event/telebirr/notify",
    TELEBIRR_PUBLIC_KEY:  `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAmwB6PVA6
E48NOzA+ddhEbIYvtvn2q97vykcLgsFVBVfFIamVvimGJoeQkAU4
7FmeFAvJq8h09QEqvdDtLLrrSgxY9UHdi/Q6QUXGw7HWNOvFtYFC
YUDXdFLdO/a9AQ12i0KW9y5xHd67qRDb6Ti+vVUnABJmjJ7piyO
0ethr0YLZoZ82GJwOnqgZNIjd6qUjGpYUXWr3UwA4yAnIu2Y7sk
L+qscqOdebZHPR/GkrY7hvgnRVpODHArDk0snaMpzVjwqfp1mZR
BdQtJkenga8/7lPXw2rVD26Sg024/BK++emrJ3wabbBXHuQAdTv
DPaWfqLnJ2Vc4922vDBiUt+cgBdVatx0jUQVUZJ4HiMIosPxtfh
BIHGCyx/lksWXwIQApHwY5K0jVKofn9TxTao8Cb8hJuWPKG8TTZ
rzUDDJoMEF0WUlw/cKz6AZRnidXz09dn5MsrsfHSbLsIfEURgwl
EGDBmieE/u+Qevnbnj3JmNRoPH60oNEqeo1tFmxuXBPAgMBAAE=
-----END PUBLIC KEY-----`
      



};
///payment/success
// Checkout
 

export default config;

