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

    if (!username) return alert("Please enter a username!");
    if (!api_key) return alert("Please enter an API key!");

    doSearch(username, api_key);
});

const doSearch = async (username, api_key) => {
    $("#status").innerHTML = "Loading...";

    const done = tracks => {
        const results = $("#results");
        results.innerHTML = "";

        const html = tracks.sort().map(track => {
            const song = track.replace(/\+noredirect\//).split("library/music/")[1].split("/");
            const artist = decodeURI(song[0].replace(/\+/g, " "));
            const title = decodeURI(song[2].replace(/\+/g, " "));

            return `<li><input type="checkbox" /> <a target="_blank" href="${track}">${artist} - ${title}</a></li>`
        }).join("");
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
        const checked = $("#form_check_all").checked;
        const limit = 200;
        const pages = Math.ceil(data.user.playcount / limit);
        
        const startPage = checked ? 1 : Math.max(1, Math.floor(parseInt($("#form_start").value) / limit) + 1);
        const endPage = checked ? pages : Math.min(pages, Math.floor(parseInt($("#form_end").value) / limit) + 1);

        const promises = [];
        for (let i = startPage; i <= endPage; i++) {
            const resFunc = data => {
                if (!data || !data.recenttracks || !data.recenttracks.track || !Array.isArray(data.recenttracks.track)) {
                    promises.push(lastfm({
                        user: username,
                        api_key: api_key,
                        method: "user.getrecenttracks",
                        limit: limit,
                        page: i,
                    }).then(resFunc).catch(error => catchError(error)));
                    return;
                }
                const filteredTracks = data.recenttracks.track.filter(track => !track.album["#text"]);
                tracks = tracks.concat(filteredTracks.map(x => `https://last.fm/user/${username}/library${x.url.substring(19)}`));
                loaded++;
                $("#status").innerHTML = `Loading... ${Math.round(loaded / (endPage - startPage) * 100)}%`;
                if (loaded >= (endPage - startPage + 1)) done([...new Set(tracks)]);
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

($("#form_check_all").oninput = () => {
    const checked = $("#form_check_all").checked;
    $$(".check_all_toggle").forEach(elm => elm.style.display = checked ? 'none' : 'block');
})();