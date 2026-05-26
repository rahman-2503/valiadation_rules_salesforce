function loginSalesforce() {

    window.location.href = "/login";
}

function logout() {

    window.location.href = "/logout";
}

function showMetadataLoader() {

    window.location.href =
        "/metadata.html";
}

async function loadUserInfo() {

    try {

        const response = await fetch("/user-info");

        const data = await response.json();

        if (data.loggedIn) {

            document.getElementById(
                "loginSection"
            ).style.display = "none";

            document.getElementById(
                "dashboardSection"
            ).style.display = "block";

            document.getElementById(
                "userInfo"
            ).innerHTML = `
                <div class="user-modern">
                    <h3>${data.username}</h3>
                    <p>${data.organization}</p>
                </div>
            `;
        }

    } catch (error) {

        console.log(error);
    }
}

loadUserInfo();