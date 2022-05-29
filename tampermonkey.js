// ==UserScript==
// @name         GitHub commits page navigator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Append a menu at the bottom of a github.com's commit page to jump to any commit page in the current repository. It makes it easier to navigate between commits pages and jump to the first or last page.
// @author       github.com/layderv
// @match        https://github.com/*/*/commits*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';


    async function numberOfCommits(owner, repo) {
        const m = 100;
        const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${m}`;

        const pages = await fetch(url, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
        })
        .then((data) => data.headers)
        .then((result) => result.get("link").split(",")[1].match(/.*page=(?<pages>\d+)/).groups.pages);
        return await fetch(`${url}&page=${pages}`, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
        })
        .then((data) => data.json())
        .then((data) => data.length + (pages - 1) * m)
        .catch((err) => {
            console.log(err);
        });
    };

    function goto(page) {
        const rx = /(?<rest0>.*)(?<dir>after|before)=(?<com>[0-9a-z]+)\+(?<page>[0-9]+)(?<rest1>&.*)/
        let res = document.location.search.match(rx);
        if (page === 0) {
            document.location.search = '';
            return;
        }
        if (res === null) {
            if (bottom.children.length > 1) {
                res = bottom.children[1].href.replace(document.location.href, '').match(rx);
            }
        }
        if (res !== null) {
            res = res.groups;
            document.location.search = `${res.rest0}${res.dir}=${res.com}+${page}${res.rest1}`;
        }
    }

    function repoOwner() {
        // https://github.com/owner/repo/
        const rx = /https:\/\/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/?.*/;
        const res = document.location.href.match(rx).groups;
        return [res.owner, res.repo];
    }

    const buttons = document.getElementsByClassName('BtnGroup');
    const bottom = buttons[buttons.length - 1];

    if (!bottom || bottom.innerText !== 'Newer\nOlder') {
        return;
    }

    const form = document.createElement('p');
    const label = document.createElement('label');
    form.appendChild(label);
    const select = document.createElement('select');
    select.size = 4;
    label.appendChild(select);
    const [owner, repo] = repoOwner();
    const pages = await numberOfCommits(owner, repo);
    let opt;
    for (let i = 0; i < pages; i += 35) {
        opt = document.createElement('option');
        opt.value = `Page ${i / 35}`;
        opt.innerText = opt.value;
        opt.onclick = function() {goto(i)}
        select.appendChild(opt);
    }
    const p = document.createElement('p');
    p.innerText = 'Jump to:';
    bottom.parentElement.appendChild(p);
    bottom.parentElement.appendChild(form);
})();
