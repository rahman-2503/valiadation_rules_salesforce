let pendingChanges = {};

async function loadUserInfo() {

    try {

        const response = await fetch("/user-info");

        const data = await response.json();

        document.getElementById("metaUserInfo").innerHTML = `
            <div class="user-modern">
                <h3>${data.username}</h3>
                <p>${data.organization}</p>
            </div>
        `;

    } catch (error) {

        console.log(error);
    }
}

async function loadValidationRules() {

    try {

        const response = await fetch("/validation-rules");

        const rules = await response.json();

        const rulesList =
            document.getElementById("rulesList");

        rulesList.innerHTML = "";

        rules.forEach(rule => {

            const checked =
                pendingChanges[rule.Id] !== undefined
                ? pendingChanges[rule.Id]
                : rule.Active;

            const li = document.createElement("li");

            li.innerHTML = `
                <div class="rule-card">

                    <div>
                        <h3>${rule.ValidationName}</h3>

                        <p>
                            ${checked ? "Enabled" : "Disabled"}
                        </p>
                    </div>

                    <label class="switch">

                        <input
                            type="checkbox"
                            ${checked ? "checked" : ""}
                            onchange="toggleRule('${rule.Id}', this.checked)"
                        >

                        <span class="slider"></span>

                    </label>

                </div>
            `;

            rulesList.appendChild(li);
        });

    } catch (error) {

        console.log(error);
    }
}

function toggleRule(id, status) {

    pendingChanges[id] = status;
}

async function deployChanges() {

    const deployBtn =
        document.getElementById("deployBtn");

    deployBtn.innerText = "Deploying...";

    try {

        const response = await fetch("/deploy", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                changes: pendingChanges
            })
        });

        const data = await response.json();

        alert(data.message);

        deployBtn.innerText = "Deploy Changes";

        pendingChanges = {};

        loadValidationRules();

    } catch (error) {

        console.log(error);

        alert("Deployment Failed");

        deployBtn.innerText = "Deploy Changes";
    }
}

async function enableAllRules() {

    try {

        await fetch("/enable-all", {
            method: "POST"
        });

        loadValidationRules();

    } catch (error) {

        console.log(error);
    }
}

async function disableAllRules() {

    try {

        await fetch("/disable-all", {
            method: "POST"
        });

        loadValidationRules();

    } catch (error) {

        console.log(error);
    }
}

async function rollbackRules() {

    try {

        await fetch("/rollback", {
            method: "POST"
        });

        alert("Rollback Successful");

        loadValidationRules();

    } catch (error) {

        console.log(error);
    }
}

function goHome() {

    window.location.href = "/";
}

loadUserInfo();
loadValidationRules();