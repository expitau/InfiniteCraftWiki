async function craft(a, b) {
    let res;
    do {
        try {
            res = await fetch(`https://neal.fun/api/infinite-craft/pair?first=${a}&second=${b}`, {
                "headers": {
                    "accept": "*/*",
                    "Referer": "https://neal.fun/infinite-craft/",
                },
                "method": "GET"
            });
        } catch {
            res = { status: 500 }
        }
        if (res.status != 200) {
            console.log("Rate limited, retrying in 5s...")
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    } while (res.status != 200)

    // Wait 70ms to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 70))

    return await res.json()
}

module.exports = { craft }
