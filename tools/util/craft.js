const axios = require('axios');
axios.defaults.headers = {}
const axiosClient = axios.create({
    headers: {
        "Host": "neal.fun",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": "https://neal.fun/infinite-craft/",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
    },
    withCredentials: true,
    baseURL: "https://neal.fun",
})

const hasCookie = false;

async function getCookie() {
    await axiosClient.get("https://neal.fun/infinite-craft/")
    await new Promise(resolve => setTimeout(resolve, 500))
}

async function craft(a, b) {
    if (!hasCookie) {
        await getCookie();
    }
    let res;
    do {
        try {
            res = await axiosClient.get(`https://neal.fun/api/infinite-craft/pair?first=${encodeURIComponent(a)}&second=${encodeURIComponent(b)}`);
        } catch {
            res = { status: 500 }
        }
        if (res.status != 200) {
            console.log("Rate limited, retrying in 5s...")
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    } while (res.status != 200)

    // Wait 70ms to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 500))

    return res.data;
}

module.exports = { craft }
