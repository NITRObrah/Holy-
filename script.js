const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');

// [https://www.jsdelivr.com/tools/purge](https://www.jsdelivr.com/tools/purge)
const zonesURL = "https://raw.githubusercontent.com/ten8mystery/Holy-Salmon/refs/heads/main/data/zones.json";
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const NewhtmlURL = "https://raw.githubusercontent.com/ten8mystery/Holy-Salmon-New-Html-Games-/refs/heads/main/";

let zones = [];
let popularityData = {};

async function listZones() {
    try {
        const response = await fetch(zonesURL + "?t=" + Date.now());
        const json = await response.json();
        zones = json;
        await fetchPopularity();
        sortZones();
        const search = new URLSearchParams(window.location.search);
        const id = search.get('id');
        if (id) {
            const zone = zones.find(zone => zone.id + '' === id + '');
            if (zone) {
                openZone(zone);
            }
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `Error loading games: ${error}`;
    }
}

async function fetchPopularity() {
    try {
        const response = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
        const data = await response.json();
        data.forEach(file => {
            const idMatch = file.name.match(/\\/(\\d+)\\.html$/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                popularityData[id] = file.hits.total;
            }
        });
    } catch (error) {
        popularityData[0] = 0;
    }
}

function sortZones() {
    const sortBy = sortOptions.value;
    if (sortBy === 'name') {
        zones.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'id') {
        zones.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'popular') {
        zones.sort((a, b) => (popularityData[b.id] || 0) - (popularityData[a.id] || 0));
    }
    zones.sort((a, b) => (a.id === -1 ? -1 : b.id === -1 ? 1 : 0));
    displayZones(zones);
}

function displayZones(zones) {
    container.innerHTML = "";
    zones.forEach((file, index) => {
        const zoneItem = document.createElement("div");
        zoneItem.className = "zone-item";
        zoneItem.onclick = () => openZone(file);
        const img = document.createElement("img");
        img.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        zoneItem.appendChild(img);
        const button = document.createElement("button");
        button.textContent = file.name;
        button.onclick = (event) => {
            event.stopPropagation();
            openZone(file);
        };
        zoneItem.appendChild(button);
        container.appendChild(zoneItem);
    });
    if (container.innerHTML === "") {
        container.innerHTML = "No games found.";
    } else {
        document.getElementById("zoneCount").textContent = `Games Loaded: ${zones.length}`;
    }
}

function filterZones() {
    const query = searchBar.value.toLowerCase();
    const filteredZones = zones.filter(zone => zone.name.toLowerCase().includes(query));
    displayZones(filteredZones);
}

function openZone(file) {
    if (file.url.startsWith("http")) {
        window.open(file.url, "_blank");
    } else {
        const url = file.url
            .replace("{COVER_URL}", coverURL)
            .replace("{HTML_URL}", htmlURL)
            .replace("{NEWHTML_URL}", NewhtmlURL);
        fetch(url + "?t=" + Date.now())
            .then(response => response.text())
            .then(html => {
                if (zoneFrame.contentDocument === null) {
                    zoneFrame = document.createElement("iframe");
                    zoneFrame.id = "zoneFrame";
                    zoneViewer.appendChild(zoneFrame);
                }
                zoneFrame.contentDocument.open();
                zoneFrame.contentDocument.write(html);
                zoneFrame.contentDocument.close();
                document.getElementById('zoneName').textContent = file.name;
                document.getElementById('zoneId').textContent = file.id;
                document.getElementById('zoneAuthor').textContent = "by " + file.author;
                if (file.authorLink) {
                    document.getElementById('zoneAuthor').href = file.authorLink;
                }
                zoneViewer.style.display = "block";
                const url = new URL(window.location);
                url.searchParams.set('id', file.id);
                history.pushState(null, '', url.toString());
            })
            .catch(error => alert("Failed to load game: " + error));
    }
}

function aboutBlank() {
    const newWindow = window.open("about:blank", "_blank");
    const id = document.getElementById('zoneId').textContent;
    let zone = zones.find(zone => zone.id + '' === id);
    if (!zone) return;
    const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    fetch(url + "?t=" + Date.now())
        .then(response => response.text())
        .then(html => {
            if (newWindow) {
                newWindow.document.open();
                newWindow.document.write(html);
                newWindow.document.close();
            }
        });
}

function closeZone() {
    zoneViewer.style.display = "none";
    if (zoneFrame && zoneViewer.contains(zoneFrame)) {
        zoneViewer.removeChild(zoneFrame);
    }
    const url = new URL(window.location);
    url.searchParams.delete('id');
    history.pushState(null, '', url.toString());
}

function downloadZone() {
    const id = document.getElementById('zoneId').textContent;
    let zone = zones.find(zone => zone.id + '' === id);
    if (!zone) return;
    fetch(zone.url.replace("{HTML_URL}", htmlURL) + "?t=" + Date.now())
        .then(res => res.text())
        .then(text => {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = zone.name + ".html";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
}

function fullscreenZone() {
    if (zoneFrame && zoneFrame.requestFullscreen) {
        zoneFrame.requestFullscreen();
    } else if (zoneFrame && zoneFrame.mozRequestFullScreen) {
        zoneFrame.mozRequestFullScreen();
    } else if (zoneFrame && zoneFrame.webkitRequestFullscreen) {
        zoneFrame.webkitRequestFullscreen();
    } else if (zoneFrame && zoneFrame.msRequestFullscreen) {
        zoneFrame.msRequestFullscreen();
    }
}

function saveData() {
    let data = JSON.stringify(localStorage) + "\\n\\n|\\n\\n" + document.cookie;
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${Date.now()}.data`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const parts = content.split("\\n\\n|\\n\\n");
        const localStorageData = parts[0];
        const cookieData = parts[1];
        try {
            const parsed = JSON.parse(localStorageData);
            for (let key in parsed) {
                localStorage.setItem(key, parsed[key]);
            }
        } catch (error) {}
        if (cookieData) {
            const cookies = cookieData.split("; ");
            cookies.forEach(cookie => {
                document.cookie = cookie;
            });
        }
        alert("Data loaded");
    };
    reader.readAsText(file);
}

function darkMode() {
    document.body.classList.toggle("dark-mode");
}

function cloakIcon(url) {
    const link = document.querySelector("link[rel~='icon']");
    link.rel = "icon";
    if ((url + "").trim().length === 0) {
        link.href = "favicon.png";
    } else {
        link.href = url;
    }
}

function cloakName(string) {
    if ((string + "").trim().length === 0) {
        document.title = "ames sight.w";
        return;
    }
    document.title = string;
}

function tabCloak() {
    closePopup();
    document.getElementById('popupTitle').textContent = "Tab Cloak";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <label for="tab-cloak-textbox" style="font-weight: bold;">Set Tab Title:</label><br>
        <input type="text" id="tab-cloak-textbox" placeholder="Enter new tab name..." oninput="cloakName(this.value)">
        <br><br><br><br>
        <label for="tab-cloak-textbox" style="font-weight: bold;">Set Tab Icon:</label><br>
        <input type="text" id="tab-cloak-textbox" placeholder="Enter new tab icon..." oninput='cloakIcon(this.value)'>
        <br><br><br>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

const settings = document.getElementById('settings');
settings.addEventListener('click', () => {
    document.getElementById('popupTitle').textContent = "Settings";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <button class="settings-button" onclick="darkMode()">Toggle Theme</button>
        <br><br>
        <button class="settings-button" onclick="tabCloak()">Hide your site</button>
        <br>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
});

function showContact() {
    document.getElementById('popupTitle').textContent = "Contact";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `<p>haha u tried</p>`;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function loadPrivacy() {
    document.getElementById('popupTitle').textContent = "Privacy Policy";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <div style="max-height: 60vh; overflow-y: auto;">
            <h2>Privacy Policy</h2>
            <p>Last updated: April 17, 2025</p>
            <p>This site collects no personal data beyond what is required to run the requested games.</p>
            <p>We do not track or share any sensitive information.</p>
        </div>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = "none";
}

listZones();

// School block bypass helpers (unchanged)
const schoolList = ["deledao", "goguardian", "lightspeed", "linewize", "securly", ".edu/"];

function isBlockedDomain(url) {
    const domain = new URL(url, location.origin).hostname + "/";
    return schoolList.some(school => domain.includes(school));
}

const originalFetch = window.fetch;
window.fetch = function (url, options) {
    if (isBlockedDomain(url)) {
        console.warn("lam");
        return Promise.reject(new Error("lam"));
    }
    return originalFetch.apply(this, arguments);
};

const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    if (isBlockedDomain(url)) {
        console.warn("lam");
        return;
    }
    return originalOpen.apply(this, arguments);
};

HTMLCanvasElement.prototype.toDataURL = function (...args) {
    return "";
};
