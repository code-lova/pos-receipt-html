(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);

    const formPanel = $('formPanel');
    const itemsBody = $('itemsBody');
    const addItemBtn = $('addItemBtn');
    const printBtn = $('printBtn');
    const downloadImageBtn = $('downloadImageBtn');
    const storeLogoInput = $('storeLogo');
    const receiptPaper = $('receiptPaper');

    const DEFAULT_ITEMS = [
        ['1/2 Bag of rice', 1, 51500],
        ['Groundnut oil', 1, 30500],
        ['Tin-tomatoes', 2, 6000],
        ['Chicken', 1, 40000],
        ['Fresh Tomatoes & pepper', 1, 10000],
        ['Spices', 1, 16000],
        ['Beef', 1, 25000],
        ['Garri', 1, 15000],
        ['Pumkin Leaves', 1, 3800],
        ['Palm Oil', 1, 3000],
        ['Melon', 1, 10000],
    ];

    const CURRENCY_SYMBOLS = {
        NGN: '₦',
        USD: '$',
    };

    let logoDataUrl = '';

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    function formatMoney(n) {
        const num = Number.isFinite(n) ? n : 0;
        return Math.round(num).toLocaleString('en-NG');
    }

    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
        }
        return hash;
    }

    function mulberry32(seed) {
        return function () {
            seed |= 0;
            seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function generateBarcodeSvg(code) {
        const rand = mulberry32(hashString(code || 'RECEIPT'));
        const barCount = 34;
        const height = 40;
        let x = 0;
        let bars = '';
        for (let i = 0; i < barCount; i++) {
            const w = 1 + Math.floor(rand() * 3);
            if (i % 2 === 0) {
                bars += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000"/>`;
            }
            x += w;
        }
        return `<svg viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" class="barcode-svg">${bars}</svg>`;
    }

    function formatDate(isoDate) {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}/${m}/${y}`;
    }

    function formatTime(t) {
        if (!t) return '';
        let [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    function createItemRow(name, qty, rate) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" data-field="name" placeholder="Item name" value="${escapeHtml(name || '')}"></td>
            <td><input type="number" data-field="qty" class="qty-input" min="0" step="any" value="${qty ?? 1}"></td>
            <td><input type="number" data-field="rate" class="rate-input" min="0" step="0.01" value="${rate ?? 0}"></td>
            <td class="amount-cell">0.00</td>
            <td><button type="button" class="remove-btn" title="Remove item">&#10005;</button></td>
        `;
        return tr;
    }

    function addItemRow(name, qty, rate) {
        itemsBody.appendChild(createItemRow(name, qty, rate));
    }

    function getFormValues() {
        return {
            template: $('template').value,
            currency: $('currency').value,
            storeName: $('storeName').value.trim(),
            address1: $('storeAddress1').value.trim(),
            address2: $('storeAddress2').value.trim(),
            phone: $('storePhone').value.trim(),
            tin: $('storeTin').value.trim(),
            date: $('metaDate').value,
            time: $('metaTime').value,
            tableNo: $('metaTable').value.trim(),
            billNo: $('metaBill').value.trim(),
            payment: $('metaPayment').value.trim(),
            vatPercent: parseFloat($('vatPercent').value) || 0,
            tendered: parseFloat($('tendered').value) || 0,
            thankyou: $('footerThankyou').value.trim(),
            note: $('footerNote').value.trim(),
            poweredBy1: $('footerPoweredBy1').value.trim(),
            poweredBy2: $('footerPoweredBy2').value.trim(),
        };
    }

    function getItems() {
        const rows = [...itemsBody.querySelectorAll('tr')];
        return rows.map((row) => {
            const name = row.querySelector('[data-field="name"]').value.trim();
            const qty = parseFloat(row.querySelector('[data-field="qty"]').value) || 0;
            const rate = parseFloat(row.querySelector('[data-field="rate"]').value) || 0;
            const amount = qty * rate;
            row.querySelector('.amount-cell').textContent = formatMoney(amount);
            return { name, qty, rate, amount, hasContent: !!(name || qty || rate) };
        }).filter((item) => item.hasContent);
    }

    function renderClassic(f, items, sums, money) {
        const { subtotal, vat, total, change } = sums;

        const itemRowsHtml = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.name) || '&mdash;'}</td>
                <td>${item.qty}</td>
                <td class="price">${money(item.rate)}</td>
                <td class="price">${money(item.amount)}</td>
            </tr>
        `).join('');

        return `
            <header>
                ${logoDataUrl ? `<img id="logo" src="${logoDataUrl}" alt="Store logo">` : ''}
                <p class="store-name">${escapeHtml(f.storeName) || 'Your Store Name'}</p>
                <p class="store-info">
                    ${f.address1 ? escapeHtml(f.address1) + '<br>' : ''}
                    ${f.address2 ? escapeHtml(f.address2) + '<br>' : ''}
                    ${f.phone ? 'Tel: ' + escapeHtml(f.phone) : ''}
                </p>
            </header>
            <hr class="dashed-rule">
            ${f.tin ? `<p>TIN: ${escapeHtml(f.tin)}</p>` : ''}
            <table class="bill-details">
                <tbody>
                    <tr>
                        <td>Date : <span>${formatDate(f.date)}</span></td>
                        <td>Time : <span>${formatTime(f.time)}</span></td>
                    </tr>
                    <tr>
                        <td>Table #: <span>${escapeHtml(f.tableNo)}</span></td>
                        <td>Bill # : <span>${escapeHtml(f.billNo)}</span></td>
                    </tr>
                    <tr>
                        <th class="center-align" colspan="2"><span class="receipt">*** ORIGINAL RECEIPT ***</span></th>
                    </tr>
                </tbody>
            </table>
            <table class="items">
                <thead>
                    <tr>
                        <th class="heading name">Item</th>
                        <th class="heading qty">Qty</th>
                        <th class="heading rate">Rate</th>
                        <th class="heading amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRowsHtml || '<tr><td colspan="4" class="center-align">No items added</td></tr>'}
                    <tr>
                        <td colspan="3" class="sum-up line">Subtotal</td>
                        <td class="line price">${money(subtotal)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="sum-up">VAT (${f.vatPercent}%)</td>
                        <td class="price">${money(vat)}</td>
                    </tr>
                    <tr>
                        <th colspan="3" class="total text">Total</th>
                        <th class="total price">${money(total)}</th>
                    </tr>
                </tbody>
            </table>
            <section>
                <p>Paid by : <span>${escapeHtml(f.payment)}</span></p>
                <p>Amount Tendered : <span class="price">${money(f.tendered)}</span></p>
                <p>${change >= 0 ? 'Change' : 'Balance Due'} : <span class="price">${money(Math.abs(change))}</span></p>
                <hr class="dashed-rule">
                <div class="barcode-wrap">
                    ${generateBarcodeSvg(f.billNo + f.date)}
                    <p class="barcode-number">${escapeHtml(f.billNo)}</p>
                </div>
                <p class="thankyou">${escapeHtml(f.thankyou)}</p>
                <p class="center-align">${escapeHtml(f.note)}</p>
            </section>
            <footer style="text-align:center">
                <p class="powered-by">${escapeHtml(f.poweredBy1)}</p>
                <p class="powered-by">${escapeHtml(f.poweredBy2)}</p>
            </footer>
        `;
    }

    function renderCompact(f, items, sums, money) {
        const { subtotal, vat, total, change } = sums;

        const itemRowsHtml = items.map((item) => `
            <div class="compact-row">
                <span>${item.qty} ${escapeHtml(item.name) || '&mdash;'}</span>
                <span>${money(item.amount)}</span>
            </div>
        `).join('') || '<div class="compact-row"><span>No items added</span></div>';

        return `
            <div class="compact-header">
                ${logoDataUrl ? `<img id="logo" src="${logoDataUrl}" alt="Store logo">` : ''}
                <p class="compact-store-name">${escapeHtml(f.storeName) || 'Your Store Name'}</p>
                <p class="compact-address">
                    ${escapeHtml([f.address1, f.address2].filter(Boolean).join(', '))}
                    ${f.phone ? '<br>Tel: ' + escapeHtml(f.phone) : ''}
                </p>
            </div>
            <hr class="dashed-rule">
            <div class="compact-items">
                ${itemRowsHtml}
            </div>
            <hr class="dashed-rule">
            <div class="compact-row"><span>Trans</span><span>${escapeHtml(f.billNo)}</span></div>
            <div class="compact-row"><span>Date</span><span>${formatDate(f.date)} ${formatTime(f.time)}</span></div>
            <div class="compact-row"><span>Payment</span><span>${escapeHtml(f.payment)}</span></div>
            <hr class="dashed-rule">
            <div class="compact-totals">
                <div class="compact-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
                <div class="compact-row"><span>Tax</span><span>${money(vat)}</span></div>
                <div class="compact-row compact-total"><span>Total</span><span>${money(total)}</span></div>
                <div class="compact-row"><span>Tendered</span><span>${money(f.tendered)}</span></div>
                <div class="compact-row"><span>${change >= 0 ? 'Change' : 'Balance Due'}</span><span>${money(Math.abs(change))}</span></div>
            </div>
            <div class="barcode-wrap">
                ${generateBarcodeSvg(f.billNo + f.date)}
                <p class="barcode-number">${escapeHtml(f.billNo)}</p>
            </div>
            <div class="compact-footer">
                <p>${escapeHtml(f.note)}</p>
                <p>${escapeHtml(f.thankyou)}</p>
            </div>
        `;
    }

    function renderPreview() {
        const f = getFormValues();
        const items = getItems();

        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const vat = subtotal * (f.vatPercent / 100);
        const total = subtotal + vat;
        const change = f.tendered - total;
        const sums = { subtotal, vat, total, change };

        const symbol = CURRENCY_SYMBOLS[f.currency] || '';
        const money = (n) => `<span class="currency-symbol">${symbol}</span>${formatMoney(n)}`;

        receiptPaper.className = `receipt-paper template-${f.template}`;
        receiptPaper.innerHTML = f.template === 'compact'
            ? renderCompact(f, items, sums, money)
            : renderClassic(f, items, sums, money);
    }

    const PRINT_WIDTH_IN = 3.15;
    const CSS_PX_PER_IN = 96; // fixed by the CSS spec, independent of screen DPI

    function setDynamicPageSize() {
        const clone = receiptPaper.cloneNode(true);
        clone.removeAttribute('id');
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.maxWidth = 'none';
        clone.style.width = PRINT_WIDTH_IN + 'in';
        clone.style.boxShadow = 'none';
        clone.style.padding = '22px 8px 50px 8px';
        document.body.appendChild(clone);
        const heightIn = clone.getBoundingClientRect().height / CSS_PX_PER_IN;
        document.body.removeChild(clone);

        let styleTag = document.getElementById('dynamicPageSize');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamicPageSize';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `@media print { @page { size: ${PRINT_WIDTH_IN}in ${heightIn.toFixed(2)}in; margin: 0; } }`;
    }

    async function downloadAsImage() {
        if (typeof html2canvas === 'undefined') {
            alert('Image export needs an internet connection to load a required library. Please check your connection and try again.');
            return;
        }

        const clone = receiptPaper.cloneNode(true);
        clone.removeAttribute('id');
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.maxWidth = 'none';
        clone.style.width = '340px';
        clone.style.boxShadow = 'none';
        document.body.appendChild(clone);

        try {
            const canvas = await html2canvas(clone, { backgroundColor: '#ffffff', scale: 2 });
            const billNo = $('metaBill').value.trim() || 'receipt';
            const link = document.createElement('a');
            link.download = `receipt-${billNo}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            document.body.removeChild(clone);
        }
    }

    function init() {
        const now = new Date();
        $('metaDate').value = now.toISOString().slice(0, 10);
        $('metaTime').value = now.toTimeString().slice(0, 5);

        DEFAULT_ITEMS.forEach(([name, qty, rate]) => addItemRow(name, qty, rate));

        formPanel.addEventListener('input', renderPreview);
        formPanel.addEventListener('change', renderPreview);

        addItemBtn.addEventListener('click', () => {
            addItemRow('', 1, 0);
            renderPreview();
        });

        itemsBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                e.target.closest('tr').remove();
                renderPreview();
            }
        });

        storeLogoInput.addEventListener('change', () => {
            const file = storeLogoInput.files[0];
            if (!file) {
                logoDataUrl = '';
                renderPreview();
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                logoDataUrl = reader.result;
                renderPreview();
            };
            reader.readAsDataURL(file);
        });

        printBtn.addEventListener('click', () => {
            setDynamicPageSize();
            window.print();
        });

        downloadImageBtn.addEventListener('click', downloadAsImage);

        renderPreview();
    }

    init();
})();
