(async() => {
    function log(msg) {
        console.log("Tvoy Startup extension: " + msg)
    }
    
    log("Hello :)");
    
    async function fetchCurrencyRate() {
    
        log('fetching currency exchange...');
    
        const invoiceDateStr = document.getElementById('sales_invoice_proforma_form_soldAt').value ?? '';
        if (!invoiceDateStr) {
            return;
        }
    
        // 2023-08-07
        log('invoice date: ' + invoiceDateStr);
        const [yr, mon, day] = invoiceDateStr.split('-');
        const dt = new Date(yr, mon - 1, day);
        dt.setDate(dt.getDate() - 1);

        const data = await chrome.runtime.sendMessage({
            type: 'fetchcurrencyrate',
            yr: dt.getFullYear(),
            mon: dt.getMonth() + 1,
            day: dt.getDate()
        });
        log('received data:');
        console.log(data);
    
        const rates = [...data.rates];
        /*  [
                { "no": "1/A/NBP/2012", "effectiveDate": "2012-01-02", "mid": 5.348 },
                { "no": "2/A/NBP/2012", "effectiveDate": "2012-01-03", "mid": 5.3394 }
            ] */
        rates.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
        
        log('rates, sorted:');
        console.log(rates);
    
        var rate = rates[0].mid;
        log('exchange rate: ' + rate);
        
        document.getElementById('sales_invoice_proforma_form_payment_exchange').value = rate;
    }
    
    $('<button>', {
        text: 'fetch',
    })
        .on('click', async (evt) => {
            fetchCurrencyRate();
            evt.preventDefault();
        })
        .insertAfter('#sales_invoice_proforma_form_payment_exchange');
})();
