let pendingChanges = {};

async function loadUserInfo() {

    const response = await fetch("/user-info");

    const data = await response.json();

    document.getElementById("metaUserInfo").innerHTML = `
        <div class="user-modern">
            <h3>${data.username}</h3>
            <p>${data.organization}</p>
        </div>
    `;
}

async function loadValidationRules() {

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
}

function toggleRule(id, status) {

    pendingChanges[id] = status;
}

async function deployChanges() {

    const deployBtn =
        document.getElementById("deployBtn");

    deployBtn.innerText = "Deploying...";

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
}

async function enableAllRules() {

    await fetch("/enable-all", {
        method: "POST"
    });

    loadValidationRules();
}

async function disableAllRules() {

    await fetch("/disable-all", {
        method: "POST"
    });

    loadValidationRules();
}

async function rollbackRules() {

    await fetch("/rollback", {
        method: "POST"
    });

    alert("Rollback Successful");

    loadValidationRules();
}

function goHome() {

    window.location.href = "/";
}

loadUserInfo();
loadValidationRules();