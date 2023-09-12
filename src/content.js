(async() => {
    function log(msg) {
        console.log('Tvoy Startup extension: ' + msg)
    }
    
    log('Hello :)');

    function getInvoiceDate() {
        const invoiceDateStr = document.getElementById('sales_invoice_proforma_form_soldAt').value ?? '';
        if (!invoiceDateStr) {
            return;
        }
    
        // 2023-08-07
        log('invoice date: ' + invoiceDateStr);
        const [yr, mon, day] = invoiceDateStr.split('-');
        const dt = new Date(yr, mon - 1, day);
        return dt;
    }

    async function fetchCurrencyRate(invoiceDate) {

        log('fetching currency exchange rate...');

        // Subtracting one day from the invoice date to fetch the exchange rates
        // available until the day before the invoice date. This ensures that the
        // rate used corresponds to the latest available information prior to the
        // invoice date.
        var dt = new Date(invoiceDate);
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

        return parseFloat(rate);
    }
    
    async function setCurrencyRate() {
        const dt = getInvoiceDate();
        const rate = await fetchCurrencyRate(dt);
        document.getElementById('sales_invoice_proforma_form_payment_exchange').value = rate;
        return rate;
    }

    async function ensureCurrencyRate() {
        let rate = document.getElementById('sales_invoice_proforma_form_payment_exchange').value;
        return rate ? parseFloat(rate) : await setCurrencyRate();
    }

    async function calcFoundationFee() {
        log('calculating PLN fee from USD exchange rate...');

        let errAnalysisIdx = -1
        
        for (let i = 0; i < 100; i++) {

            let errorAnalysisElm =
                document.getElementById(`sales_invoice_proforma_form_products_${i}_item_product`)
                || document.getElementById(`sales_invoice_proforma_form_services_${i}_serviceName`);

            if (!errorAnalysisElm) {
                continue;
            }

            if (!errorAnalysisElm.value?.toLowerCase()?.startsWith('error analysis')
                && !errorAnalysisElm.value?.toLowerCase()?.startsWith('\u0435rror analysis')) {
                continue;
            }

            log(`Error Analysis line found. Index: ${i}`);
            errAnalysisIdx = i;
            break;
        }

        if (errAnalysisIdx < 0) {
            log('Error Analysis line not found. Skipping fee calculation.');
            return;
        }

        const forceRefreshCurrencyRate = true;
        const plnFeeAmount = 300.0;
        const rate = forceRefreshCurrencyRate ? await setCurrencyRate() : await ensureCurrencyRate();

        log(`Calculating a ${plnFeeAmount} PLN fee in USD using the rate of ${rate} PLN per USD...`)

        const usdFeeAmount = plnFeeAmount / rate;
        const usdFeeAmountRounded = usdFeeAmount.toFixed(2);

        log(`The fee is ${usdFeeAmount} USD rounded to ${usdFeeAmountRounded} USD`);

        (document.getElementById(`sales_invoice_proforma_form_products_${errAnalysisIdx}_amount`)
        || document.getElementById(`sales_invoice_proforma_form_services_${errAnalysisIdx}_amount`))
            .value = 1;
        (document.getElementById(`sales_invoice_proforma_form_products_${errAnalysisIdx}_unitPrice`)
        || document.getElementById(`sales_invoice_proforma_form_services_${errAnalysisIdx}_unitPrice`))
            .value = usdFeeAmountRounded;
    }
    
    $('<button>', {
        text: 'fetch',
    })
        .on('click', (evt) => {
            setCurrencyRate();
            evt.preventDefault();
        })
        .insertAfter('#sales_invoice_proforma_form_payment_exchange');

    $('<button>', {
        text: 'Calculate Fee'
    })
        .addClass('btn btn-success')
        .css({
            'margin-left': '4px'
        })
        .on('click', (evt) => {
            calcFoundationFee();
            evt.preventDefault();
        })
        .insertAfter('#proformaItemServicesAdd');

})();
