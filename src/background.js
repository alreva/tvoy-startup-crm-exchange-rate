(async () => {
    function log(msg) {
        console.log("Tvoy Startup extension [service worker]: " + msg);
    }
    
    log('background worker loading...');

    function formatDate(dt) {
        const yr = dt.getFullYear();
        const mon = (dt.getMonth() + 1).toString().padStart(2, '0');
        const day = dt.getDate().toString().padStart(2, '0');

        return `${yr}-${mon}-${day}`;
    }
    
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    
        log('incoming message:');
        console.log(message);
    
        if (message.type === "fetchcurrencyrate") {
    
            const {yr, mon, day} = message;
            const dt = new Date(yr, mon - 1, day);
            const sdt = new Date(dt);
            sdt.setDate(dt.getDate() - 7);
    
            // const apiUrl = `https://api.nbp.pl/api/exchangerates/rates/c/usd/${message.yr}-${message.mon}-${message.day}/?format=json`;
            const apiUrl = `https://api.nbp.pl/api/exchangerates/rates/c/usd/${formatDate(sdt)}/${formatDate(dt)}/?format=json`;
            log('fetching USD exchange rate from ' + apiUrl);
            
            fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                log('fetched data:');
                console.log(data);
                sendResponse(data)
            });
        }
    
        return true;
    });
    
    log('background worker loaded.');
    
})();