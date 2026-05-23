const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const LOGIN_URL = process.env.LOGIN_URL;

let accessToken = "";
let instanceUrl = "";
let username = "";
let orgName = "";

let originalRuleStates = {};

const CODE_VERIFIER =
    "salesforcevalidationproject123456";

function generateCodeChallenge(verifier) {

    return crypto
        .createHash("sha256")
        .update(verifier)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

const CODE_CHALLENGE =
    generateCodeChallenge(CODE_VERIFIER);


// MODERN ANIMATED PAGE
function renderModernPage(
    title,
    subtitle,
    redirectUrl,
    delay = 2500
) {

    return `

    <!DOCTYPE html>

    <html lang="en">

    <head>

        <meta charset="UTF-8">

        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">

        <title>${title}</title>

        <link rel="preconnect"
              href="https://fonts.googleapis.com">

        <link rel="preconnect"
              href="https://fonts.gstatic.com"
              crossorigin>

        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
              rel="stylesheet">

        <style>

            *{
                margin:0;
                padding:0;
                box-sizing:border-box;
                font-family:'Inter',sans-serif;
            }

            body{

                min-height:100vh;

                display:flex;

                justify-content:center;

                align-items:center;

                overflow:hidden;

                background:
                linear-gradient(
                    135deg,
                    #020617,
                    #0f172a,
                    #111827
                );

                color:white;

                position:relative;
            }

            body::before{

                content:"";

                position:absolute;

                width:500px;
                height:500px;

                background:
                rgba(59,130,246,0.18);

                filter:blur(120px);

                top:-200px;
                left:-100px;

                animation:floatBlob 8s infinite ease-in-out;
            }

            body::after{

                content:"";

                position:absolute;

                width:450px;
                height:450px;

                background:
                rgba(168,85,247,0.18);

                filter:blur(120px);

                bottom:-200px;
                right:-100px;

                animation:floatBlob2 10s infinite ease-in-out;
            }

            @keyframes floatBlob{

                50%{
                    transform:
                    translateY(40px)
                    translateX(20px);
                }
            }

            @keyframes floatBlob2{

                50%{
                    transform:
                    translateY(-30px)
                    translateX(-40px);
                }
            }

            .glass-card{

                position:relative;

                width:90%;
                max-width:500px;

                padding:50px;

                border-radius:30px;

                background:
                rgba(255,255,255,0.06);

                border:
                1px solid rgba(255,255,255,0.08);

                backdrop-filter:blur(20px);

                box-shadow:
                0 10px 50px rgba(0,0,0,0.4);

                text-align:center;

                animation:fadeIn 1s ease;
            }

            @keyframes fadeIn{

                from{
                    opacity:0;
                    transform:translateY(40px);
                }

                to{
                    opacity:1;
                    transform:translateY(0);
                }
            }

            .loader{

                width:80px;
                height:80px;

                margin:auto;
                margin-bottom:35px;

                border-radius:50%;

                border:
                6px solid rgba(255,255,255,0.1);

                border-top:
                6px solid #60a5fa;

                animation:spin 1s linear infinite;
            }

            @keyframes spin{

                100%{
                    transform:rotate(360deg);
                }
            }

            h1{

                font-size:40px;

                margin-bottom:15px;

                background:
                linear-gradient(
                    90deg,
                    #60a5fa,
                    #818cf8,
                    #c084fc
                );

                -webkit-background-clip:text;
                -webkit-text-fill-color:transparent;
            }

            p{

                color:#cbd5e1;

                font-size:17px;

                line-height:1.8;
            }

            .dots{
                margin-top:25px;
            }

            .dots span{

                display:inline-block;

                width:10px;
                height:10px;

                border-radius:50%;

                background:#60a5fa;

                margin:0 5px;

                animation:bounce 1s infinite;
            }

            .dots span:nth-child(2){
                animation-delay:0.2s;
            }

            .dots span:nth-child(3){
                animation-delay:0.4s;
            }

            @keyframes bounce{

                50%{
                    transform:translateY(-8px);
                    opacity:0.5;
                }
            }

        </style>

    </head>

    <body>

        <div class="glass-card">

            <div class="loader"></div>

            <h1>${title}</h1>

            <p>${subtitle}</p>

            <div class="dots">
                <span></span>
                <span></span>
                <span></span>
            </div>

        </div>

        <script>

            setTimeout(() => {

                window.location.href =
                    "${redirectUrl}";

            }, ${delay});

        </script>

    </body>

    </html>
    `;
}


// HOME
app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/public/index.html"
    );
});


// LOGIN
app.get("/login", (req, res) => {

    const authUrl =
        `${LOGIN_URL}/services/oauth2/authorize?response_type=code`
        + `&client_id=${CLIENT_ID}`
        + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
        + `&code_challenge=${CODE_CHALLENGE}`
        + `&code_challenge_method=S256`
        + `&prompt=login`
        + `&immediate=false`;

    res.send(
        renderModernPage(
            "Connecting Salesforce",
            "Redirecting securely to OAuth login...",
            authUrl,
            1800
        )
    );
});


// CALLBACK
app.get("/callback", async (req, res) => {

    const code = req.query.code;

    try {

        const tokenResponse = await axios.post(
            `${LOGIN_URL}/services/oauth2/token`,
            null,
            {
                params: {
                    grant_type:
                    "authorization_code",

                    code,

                    client_id:
                    CLIENT_ID,

                    client_secret:
                    CLIENT_SECRET,

                    redirect_uri:
                    REDIRECT_URI,

                    code_verifier:
                    CODE_VERIFIER
                }
            }
        );

        accessToken =
            tokenResponse.data.access_token;

        instanceUrl =
            tokenResponse.data.instance_url;

        const identityUrl =
            tokenResponse.data.id;

        const userResponse =
            await axios.get(identityUrl, {

                headers: {

                    Authorization:
                    `Bearer ${accessToken}`
                }
            });

        username =
            userResponse.data.username;

        orgName =
            userResponse.data.organization_name
            || "Salesforce";

        res.send(
            renderModernPage(
                "Authentication Successful",
                "Loading validation dashboard...",
                "/",
                2200
            )
        );

    } catch (error) {

        console.log(
            error.response?.data
            || error.message
        );

        res.send(
            renderModernPage(
                "Authentication Failed",
                "Unable to connect with Salesforce.",
                "/",
                2500
            )
        );
    }
});
//
// USER INFO
//
app.get("/user-info", (req, res) => {

    res.json({

        loggedIn: !!accessToken,

        username,

        organization: orgName
    });
});


//
// LOGOUT
//
app.get("/logout", async (req, res) => {

    try {

        accessToken = "";
        instanceUrl = "";
        username = "";
        orgName = "";

        originalRuleStates = {};

        res.send(

            renderModernPage(

                "Logged Out",

                "Session cleared successfully. Redirecting to login page...",

                "/",

                2200
            )
        );

    } catch (error) {

        console.log(error.message);

        res.redirect("/");
    }
});


//
// FETCH VALIDATION RULES
//
app.get("/validation-rules", async (req, res) => {

    try {

        const query = `

        SELECT
            Id,
            ValidationName,
            Active

        FROM ValidationRule

        WHERE EntityDefinition.QualifiedApiName = 'Account'
        `;

        const response = await axios.get(

            `${instanceUrl}/services/data/v59.0/tooling/query`,

            {

                headers: {

                    Authorization:
                    `Bearer ${accessToken}`
                },

                params: {

                    q: query
                }
            }
        );

        response.data.records.forEach(rule => {

            if (!(rule.Id in originalRuleStates)) {

                originalRuleStates[rule.Id] =
                    rule.Active;
            }
        });

        res.json(response.data.records);

    } catch (error) {

        console.log(
            error.response?.data
            || error.message
        );

        res.json([]);
    }
});


//
// UPDATE RULE FUNCTION
//
async function updateRule(
    ruleId,
    status
) {

    const getResponse = await axios.get(

        `${instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${ruleId}`,

        {

            headers: {

                Authorization:
                `Bearer ${accessToken}`
            }
        }
    );

    const currentRule =
        getResponse.data;

    await axios.patch(

        `${instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${ruleId}`,

        {

            Metadata: {

                active: status,

                errorConditionFormula:
                    currentRule.Metadata
                    .errorConditionFormula,

                errorMessage:
                    currentRule.Metadata
                    .errorMessage
            }
        },

        {

            headers: {

                Authorization:
                `Bearer ${accessToken}`,

                "Content-Type":
                "application/json"
            }
        }
    );
}


//
// DEPLOY CHANGES
//
app.post("/deploy", async (req, res) => {

    try {

        const changes =
            req.body.changes;

        for (const ruleId in changes) {

            await updateRule(

                ruleId,

                changes[ruleId]
            );
        }

        res.json({

            success: true,

            message:
            "Validation Rules Deployed Successfully"
        });

    } catch (error) {

        console.log(
            error.response?.data
            || error.message
        );

        res.json({

            success: false,

            message:
            "Deployment Failed"
        });
    }
});


//
// ENABLE ALL RULES
//
app.post("/enable-all", async (req, res) => {

    try {

        const rules = await axios.get(

            `${instanceUrl}/services/data/v59.0/tooling/query`,

            {

                headers: {

                    Authorization:
                    `Bearer ${accessToken}`
                },

                params: {

                    q:
                    `SELECT Id FROM ValidationRule
                    WHERE EntityDefinition.QualifiedApiName='Account'`
                }
            }
        );

        for (const rule of rules.data.records) {

            await updateRule(
                rule.Id,
                true
            );
        }

        res.json({

            success: true
        });

    } catch (error) {

        console.log(error.message);

        res.json({

            success: false
        });
    }
});


//
// DISABLE ALL RULES
//
app.post("/disable-all", async (req, res) => {

    try {

        const rules = await axios.get(

            `${instanceUrl}/services/data/v59.0/tooling/query`,

            {

                headers: {

                    Authorization:
                    `Bearer ${accessToken}`
                },

                params: {

                    q:
                    `SELECT Id FROM ValidationRule
                    WHERE EntityDefinition.QualifiedApiName='Account'`
                }
            }
        );

        for (const rule of rules.data.records) {

            await updateRule(
                rule.Id,
                false
            );
        }

        res.json({

            success: true
        });

    } catch (error) {

        console.log(error.message);

        res.json({

            success: false
        });
    }
});


//
// ROLLBACK
//
app.post("/rollback", async (req, res) => {

    try {

        for (const ruleId in originalRuleStates) {

            await updateRule(

                ruleId,

                originalRuleStates[ruleId]
            );
        }

        res.json({

            success: true,

            message:
            "Rollback Completed Successfully"
        });

    } catch (error) {

        console.log(error.message);

        res.json({

            success: false,

            message:
            "Rollback Failed"
        });
    }
});


//
// SERVER
//
app.listen(5000, () => {

    console.log(

        "Server running on http://localhost:5000"
    );
});