(function() {
    const tabellone = document.getElementById('tabellone');
    const tooltip = document.getElementById('tooltip');
    const modal = document.getElementById('modal-acquisto');
    const counter = document.getElementById('counter');
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzDegTFimnMMFQsdTukR360jPfk3byurBwo_GPfiPKGVQ3UAwiZ8CqmiF9PoINOhxpf/exec";

    let dataCorrenteVisualizzata = new Date();
    let coloreSelezionato = "#38bdf8";
    let prezzoAttuale = 1.00;
    let codiceScontoApplicato = "";

    // Gestione selezione colore dalla nuova palette pulita
    const colorDots = document.querySelectorAll('.color-dot');
    const customColorInput = document.getElementById('input-colore-custom');

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            coloreSelezionato = dot.getAttribute('data-color');
        });
    });

    customColorInput.addEventListener('input', (e) => {
        colorDots.forEach(d => d.classList.remove('active'));
        coloreSelezionato = e.target.value;
    });

    // Gestione Codice Sconto (es. promo "TIKTOK" sconto 50%)
    const btnPromo = document.getElementById('btn-applica-promo');
    const inputPromo = document.getElementById('input-promo');
    const promoFeedback = document.getElementById('promo-feedback');
    const prezzoFinaleSpan = document.getElementById('prezzo-finale');

    btnPromo.addEventListener('click', () => {
        const codice = inputPromo.value.trim().toUpperCase();
        if (codice === "TIKTOK" || codice === "TIME50") {
            prezzoAttuale = 0.50;
            codiceScontoApplicato = codice;
            prezzoFinaleSpan.innerText = "0.50€";
            promoFeedback.style.color = "#22c55e";
            promoFeedback.innerText = "Promo applied! 50% off";
        } else {
            prezzoAttuale = 1.00;
            codiceScontoApplicato = "";
            prezzoFinaleSpan.innerText = "1€";
            promoFeedback.style.color = "#ef4444";
            promoFeedback.innerText = "Invalid promo code";
        }
    });

    function formattaDataItaliana(data) {
        let d = new Date(data);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function mostraTooltip(testoHtml, pixelRect) {
        tooltip.innerHTML = testoHtml;
        tooltip.style.display = 'block';

        const screenWidth = window.innerWidth;
        const tooltipWidth = 250;

        let leftPos = pixelRect.right + 8;
        let topPos = pixelRect.top + window.scrollY;

        if (leftPos + tooltipWidth > screenWidth - 15) {
            leftPos = pixelRect.left - tooltipWidth - 8;
        }

        if (leftPos < 10) {
            leftPos = 10;
        }

        tooltip.style.left = leftPos + 'px';
        tooltip.style.top = topPos + 'px';
    }

    async function caricaPixel() {
        let datiVenduti = new Map();
        
        try {
            const response = await fetch(GOOGLE_API_URL);
            const datiRaw = await response.json();
            datiRaw.forEach(riga => {
                if (riga[0]) {
                    let data = formattaDataItaliana(riga[0]);
                    datiVenduti.set(data, {
                        messaggio: riga[1] || "Purchased!",
                        colore: riga[2] || "#38bdf8"
                    });
                }
            });
            counter.innerText = `Pixels claimed: ${datiVenduti.size}/400`;
        } catch (e) {
            console.error("Errore caricamento dati:", e);
            counter.innerText = `Pixels claimed: 0/400`;
        }

        tabellone.innerHTML = "";
        const dataInizio = new Date(dataCorrenteVisualizzata); 
        
        for (let i = 0; i < 400; i++) {
            let dataPixelObj = new Date(dataInizio);
            dataPixelObj.setDate(dataInizio.getDate() + i);
            let dataStringa = formattaDataItaliana(dataPixelObj);
            
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            
            if (datiVenduti.has(dataStringa)) {
                pixel.classList.add('venduto');
                const pixelData = datiVenduti.get(dataStringa);
                pixel.style.backgroundColor = pixelData.colore;
                
                pixel.addEventListener('mouseenter', () => {
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${pixelData.messaggio}`, rect);
                });
                
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${pixelData.messaggio}`, rect);
                });
            } else {
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.style.display = 'none';
                    document.getElementById('data-scelta').innerText = `Date: ${dataStringa}`;
                    
                    // Reset campi modale
                    document.getElementById('input-messaggio').value = "";
                    document.getElementById('input-email').value = "";
                    document.getElementById('input-password').value = "";
                    inputPromo.value = "";
                    promoFeedback.innerText = "";
                    prezzoAttuale = 1.00;
                    prezzoFinaleSpan.innerText = "1€";
                    codiceScontoApplicato = "";
                    
                    modal.style.display = 'flex';
                    
                    document.getElementById('btn-conferma').onclick = () => {
                        const msg = document.getElementById('input-messaggio').value || "No message";
                        const email = document.getElementById('input-email').value;
                        const pwd = document.getElementById('input-password').value;

                        // Nota strutturata per PayPal comprensiva di prezzo/sconto e dati account
                        const payloadNota = `${dataStringa} | Msg: ${msg} | Color: ${coloreSelezionato} | Email: ${email} | Pwd: ${pwd} | Promo: ${codiceScontoApplicato || 'None'}`;
                        
                        window.open(`https://paypal.me/nickpetru/${prezzoAttuale}?note=${encodeURIComponent(payloadNota)}`, "_blank");
                        modal.style.display = 'none';
                    };
                });
                
                pixel.addEventListener('mouseenter', () => {
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(dataStringa, rect);
                });
            }

            tabellone.appendChild(pixel);
        }

        document.addEventListener('click', () => {
            tooltip.style.display = 'none';
        });

        document.getElementById('btn-chiudi').onclick = () => modal.style.display = 'none';
    }

    window.cambiaData = (giorni) => {
        tooltip.style.display = 'none';
        const classeAnim = giorni > 0 ? 'slide-left' : 'slide-right';
        tabellone.classList.add(classeAnim);
        
        setTimeout(() => {
            dataCorrenteVisualizzata.setDate(dataCorrenteVisualizzata.getDate() + giorni);
            tabellone.style.transition = 'none';
            tabellone.classList.remove(classeAnim);
            tabellone.style.opacity = '0';
            
            caricaPixel();
            
            setTimeout(() => {
                tabellone.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
                tabellone.style.opacity = '1';
            }, 50);
        }, 500);
    };

    caricaPixel();
})();
