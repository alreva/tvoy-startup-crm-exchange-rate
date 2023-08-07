(async() => {
    function log(msg) {
        console.log('Tvoy Startup extension: ' + msg)
    }
    
    log('Hello :)');
    
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

        // Subtracting one day from the invoice date to fetch the exchange rates
        // available until the day before the invoice date. This ensures that the
        // rate used corresponds to the latest available information prior to the
        // invoice date.
        dt.setDate(dt.getDate() - 1);

        const data = await chrome.runtime.sendMessage({
            type: 'fetch-currency-rate',
            yr: dt.getFullYear(),
            mon: dt.getMonth() + 1,
            day: dt.getDate()
        });
        
        log('received data:');
        console.log(data);

        if (!data) {
            log('received currency data is empty');
            return;
        }
    
        const rates = Array.isArray(data.rates) ? [...data.rates] : [];

        if (rates.length === 0) {
            log('received currency data does not have rates information');
            return;
        }

        /*  [
                { "no": "1/A/NBP/2012", "effectiveDate": "2012-01-02", "mid": 5.348 },
                { "no": "2/A/NBP/2012", "effectiveDate": "2012-01-03", "mid": 5.3394 }
            ] */
        rates.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
        
        log('rates, sorted:');
        console.log(rates);
    
        const rate = rates[0].mid;
        log('exchange rate: ' + rate);
        
        document.getElementById('sales_invoice_proforma_form_payment_exchange').value = rate;
    }
    
    $('<button>', {
        text: 'fetch',
    })
        .on('click', (evt) => {
            fetchCurrencyRate();
            evt.preventDefault();
        })
        .insertAfter('#sales_invoice_proforma_form_payment_exchange');
})();
