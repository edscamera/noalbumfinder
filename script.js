const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let errored = false;

const lastfm = async (options) => {
    if (errored) return;
    let url = `https://ws.audioscrobbler.com/2.0/?format=json`;

    if (options) {
        Object.keys(options).forEach(key => {
            const param = `${key}=${options[key]}`;
            if (param.includes("&") || param.includes("?")) return; 
            url += `&${key}=${options[key]}`;
        });
    }

    return await fetch(url).then(response => response.json());
};

$("#form_submit").addEventListener("click", (e) => {
    const username = $("#form_username").value;
    const api_key = $("#form_api_key").value;
    if (!username) {
        alert("Please enter a username");
        return;
    }
    if (!api_key) {
        alert("Please enter an API key");
        return;
    }

    doSearch(username, api_key);
});

const doSearch = async (username, api_key) => {
    $("#status").innerHTML = "Loading...";

    const done = tracks => {
        const results = $("#results");
        results.innerHTML = "";

        const html = tracks.map(track => `<li><input type="checkbox" /> <a target="_blank" href="${track}">${track}</a></li>`).join("");
        results.innerHTML = html;

        $("#status").innerHTML = `${new Date().toString()}<br>Tracks (${tracks.length}):`;
    };
    
    let tracks = [];
    let loaded = 0;
    lastfm({
        user: username,
        method: "user.getinfo",
        api_key: api_key,
    }).then(data => {
        const pages = Math.ceil(data.user.playcount / 200);
        
        const promises = [];
        for (let i = 1; i <= pages; i++) {
            const resFunc = data => {
                if (!data || !data.recenttracks || !data.recenttracks.track || !Array.isArray(data.recenttracks.track)) {
                    promises.push(lastfm({
                        user: username,
                        api_key: api_key,
                        method: "user.getrecenttracks",
                        limit: 200,
                        page: i,
                    }).then(resFunc).catch(error => catchError(error)));
                    return;
                }
                const filteredTracks = data.recenttracks.track.filter(track => !track.album["#text"]);
                tracks = tracks.concat(filteredTracks.map(x => x.url));
                loaded++;
                $("#status").innerHTML = `Loading... ${Math.round(loaded / pages * 100)}%`;
                if (loaded === pages) done([...new Set(tracks)]);
            };
            resFunc();
        }
    }).catch(error => catchError(error));
};

const catchError = (e) => {
    $("#status").innerHTML = "An error occurred. Please check your username and API key.";
    console.error(e);
    errored = true;
}
