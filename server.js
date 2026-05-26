const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const session = require("express-session");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    session({
        secret: "salesforce_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false
        }
    })
);

const PORT =
    process.env.PORT || 5000;

const CLIENT_ID =
    process.env.CLIENT_ID;

const CLIENT_SECRET =
    process.env.CLIENT_SECRET;

const REDIRECT_URI =
    process.env.REDIRECT_URI;

const LOGIN_URL =
    process.env.LOGIN_URL;

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

        <style>

            *{
                margin:0;
                padding:0;
                box-sizing:border-box;
                font-family:sans-serif;
            }

            body{

                min-height:100vh;

                display:flex;

                justify-content:center;

                align-items:center;

                background:
                linear-gradient(
                    135deg,
                    #020617,
                    #0f172a,
                    #111827
                );

                color:white;
            }

            .card{

                padding:50px;

                border-radius:25px;

                background:
                rgba(255,255,255,0.06);

                text-align:center;
            }

            h1{

                margin-bottom:20px;

                color:#60a5fa;
            }

            p{

                color:#cbd5e1;
            }

        </style>

    </head>

    <body>

        <div class="card">

            <h1>${title}</h1>

            <p>${subtitle}</p>

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

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

app.get("/metadata.html", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "metadata.html"
        )
    );
});

app.get("/login", (req, res) => {

    const authUrl =

        `${LOGIN_URL}/services/oauth2/authorize?response_type=code`

        + `&client_id=${CLIENT_ID}`

        + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

        + `&code_challenge=${CODE_CHALLENGE}`

        + `&code_challenge_method=S256`

        + `&prompt=login`;

    res.redirect(authUrl);
});

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

        req.session.accessToken =
            tokenResponse.data.access_token;

        req.session.instanceUrl =
            tokenResponse.data.instance_url;

        const identityUrl =
            tokenResponse.data.id;

        const userResponse =
            await axios.get(identityUrl, {

                headers: {

                    Authorization:
                    `Bearer ${req.session.accessToken}`
                }
            });

        req.session.username =
            userResponse.data.username;

        req.session.orgName =
            userResponse.data.organization_name
            || "Salesforce";

        req.session.originalRuleStates = {};

        res.send(

            renderModernPage(

                "Authentication Successful",

                "Loading Dashboard...",

                "/",

                2000
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

                "Unable to connect with Salesforce",

                "/",

                2500
            )
        );
    }
});

app.get("/user-info", (req, res) => {

    res.json({

        loggedIn:
        !!req.session.accessToken,

        username:
        req.session.username || "",

        organization:
        req.session.orgName || ""
    });
});

app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/");
    });
});
app.get("/validation-rules", async (req, res) => {

    try {

        if (!req.session.accessToken) {

            return res.json([]);
        }

        const query = `

        SELECT
            Id,
            ValidationName,
            Active

        FROM ValidationRule

        WHERE EntityDefinition.QualifiedApiName = 'Account'
        `;

        const response = await axios.get(

            `${req.session.instanceUrl}/services/data/v59.0/tooling/query`,

            {

                headers: {

                    Authorization:
                    `Bearer ${req.session.accessToken}`
                },

                params: {

                    q: query
                }
            }
        );

        response.data.records.forEach(rule => {

            if (
                !(
                    rule.Id
                    in
                    req.session.originalRuleStates
                )
            ) {

                req.session.originalRuleStates[
                    rule.Id
                ] = rule.Active;
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

async function updateRule(
    req,
    ruleId,
    status
) {

    const getResponse = await axios.get(

        `${req.session.instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${ruleId}`,

        {

            headers: {

                Authorization:
                `Bearer ${req.session.accessToken}`
            }
        }
    );

    const currentRule =
        getResponse.data;

    await axios.patch(

        `${req.session.instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${ruleId}`,

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
                `Bearer ${req.session.accessToken}`,

                "Content-Type":
                "application/json"
            }
        }
    );
}

app.post("/deploy", async (req, res) => {

    try {

        const changes =
            req.body.changes;

        for (const ruleId in changes) {

            await updateRule(

                req,

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

app.post("/enable-all", async (req, res) => {

    try {

        const rules = await axios.get(

            `${req.session.instanceUrl}/services/data/v59.0/tooling/query`,

            {

                headers: {

                    Authorization:
                    `Bearer ${req.session.accessToken}`
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
                req,
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

app.post("/disable-all", async (req, res) => {

    try {

        const rules = await axios.get(

            `${req.session.instanceUrl}/services/data/v59.0/tooling/query`,

            {

                headers: {

                    Authorization:
                    `Bearer ${req.session.accessToken}`
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
                req,
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

app.post("/rollback", async (req, res) => {

    try {

        for (
            const ruleId
            in
            req.session.originalRuleStates
        ) {

            await updateRule(

                req,

                ruleId,

                req.session.originalRuleStates[
                    ruleId
                ]
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

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );
});