(function() {
    const tabellone = document.getElementById('tabellone');
    const tooltip = document.getElementById('tooltip');
    const modalAcquisto = document.getElementById('modal-acquisto');
    const modalAccount = document.getElementById('modal-account');
    const counter = document.getElementById('counter');
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzDegTFimnMMFQsdTukR360jPfk3byurBwo_GPfiPKGVQ3UAwiZ8CqmiF9PoINOhxpf/exec";

    let dataCorrenteVisualizzata = new Date();
    let coloreSelezionato = "#38bdf8";
    let prezzoAttuale = 1.00;
    let codiceScontoApplicato = "";

    let utenteCorrente = localStorage.getItem('tc_user_email') || null;

    const btnApriAccount = document.getElementById('btn-apri-account');
    function aggiornaStatoAccountUI() {
        if (utenteCorrente) {
            btnApriAccount.innerText = utenteCorrente.split('@')[0] + " (Logout)";
        } else {
            btnApriAccount.innerText = "Account";
        }
    }
    aggiornaStatoAccountUI();

    let isModalLoginMode = true;
    btnApriAccount.addEventListener('click', () => {
        if (utenteCorrente) {
            if (confirm(`Do you want to log out from ${utenteCorrente}?`)) {
                localStorage.removeItem('tc_user_email');
                utenteCorrente = null;
                aggiornaStatoAccountUI();
                caricaPixel();
            }
        } else {
            modalAccount.style.display = 'flex';
        }
    });

    document.getElementById('acc-btn-chiudi').onclick = () => modalAccount.style.display = 'none';

    const accToggleMode = document.getElementById('acc-toggle-mode');
    const accTitle = document.getElementById('account-title');
    const accBtnAzione = document.getElementById('acc-btn-azione');

    accToggleMode.addEventListener('click', (e) => {
        e.preventDefault();
        isModalLoginMode = !isModalLoginMode;
        if (isModalLoginMode) {
            accTitle.innerText = "USER LOGIN";
            accBtnAzione.innerText = "LOG IN";
            accToggleMode.innerText = "Don't have an account? Sign up";
        } else {
            accTitle.innerText = "CREATE ACCOUNT";
            accBtnAzione.innerText = "SIGN UP";
            accToggleMode.innerText = "Already have an account? Log in";
        }
    });

    accBtnAzione.addEventListener('click', () => {
        const email = document.getElementById('acc-email').value.trim();
        const pwd = document.getElementById('acc-password').value.trim();
        const feedback = document.getElementById('account-feedback');

        if (!email || !pwd) {
            feedback.style.color = "#ef4444";
            feedback.innerText = "Please fill in all fields.";
            return;
        }

        localStorage.setItem('tc_user_email', email);
        utenteCorrente = email;
        aggiornaStatoAccountUI();
        modalAccount.style.display = 'none';
        
        document.getElementById('acc-email').value = "";
        document.getElementById('acc-password').value = "";
        feedback.innerText = "";
        
        caricaPixel();
    });

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
                        colore: riga[2] || "#38bdf8",
                        proprietario: riga[3] || ""
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
                
                const eMioPixel = utenteCorrente && pixelData.proprietario.toLowerCase() === utenteCorrente.toLowerCase();

                pixel.addEventListener('mouseenter', () => {
                    const rect = pixel.getBoundingClientRect();
                    let infoExtra = eMioPixel ? `<br><span style="color:var(--accent-color); font-weight:bold;">[YOUR PIXEL - Click to Edit]</span>` : "";
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${pixelData.messaggio}${infoExtra}`, rect);
                });
                
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = pixel.getBoundingClientRect();
                    
                    if (eMioPixel) {
                        tooltip.style.display = 'none';
                        document.getElementById('modal-main-title').innerText = "EDIT YOUR PIXEL";
                        document.getElementById('data-scelta').innerText = `Date: ${dataStringa}`;
                        document.getElementById('input-messaggio').value = pixelData.messaggio;
                        document.getElementById('promo-section').style.display = 'none';
                        
                        modalAcquisto.style.display = 'flex';
                        
                        document.getElementById('btn-conferma').innerText = "UPDATE PIXEL";
                        document.getElementById('btn-conferma').onclick = () => {
                            const msgUpdate = document.getElementById('input-messaggio').value || "Updated message";
                            const payloadNota = `UPDATE | ${dataStringa} | Msg: ${msgUpdate} | Color: ${coloreSelezionato} | Email: ${utenteCorrente}`;
                            window.open(`https://paypal.me/nickpetru/0?note=${encodeURIComponent(payloadNota)}`, "_blank");
                            modalAcquisto.style.display = 'none';
                        };
                    } else {
                        mostraTooltip(`<strong>${dataStringa}</strong><br>${pixelData.messaggio}`, rect);
                    }
                });
            } else {
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.style.display = 'none';

                    // Se non è loggato, apre direttamente la modale account a tema anziché l'alert di sistema
                    if (!utenteCorrente) {
                        isModalLoginMode = false; // Imposta di default su "Crea account" o lascia login
                        accTitle.innerText = "CREATE ACCOUNT";
                        accBtnAzione.innerText = "SIGN UP";
                        accToggleMode.innerText = "Already have an account? Log in";
                        document.getElementById('account-subtitle').innerText = "Please sign up or log in to claim this pixel.";
                        modalAccount.style.display = 'flex';
                        return;
                    }

                    document.getElementById('modal-main-title').innerText = "CLAIM YOUR PIXEL";
                    document.getElementById('data-scelta').innerText = `Date: ${dataStringa}`;
                    document.getElementById('input-messaggio').value = "";
                    inputPromo.value = "";
                    promoFeedback.innerText = "";
                    prezzoAttuale = 1.00;
                    prezzoFinaleSpan.innerText = "1€";
                    codiceScontoApplicato = "";
                    document.getElementById('promo-section').style.display = 'block';
                    document.getElementById('btn-conferma').innerText = `PAY 1€`;
                    
                    modalAcquisto.style.display = 'flex';
                    
                    document.getElementById('btn-conferma').onclick = () => {
                        const msg = document.getElementById('input-messaggio').value || "No message";
                        const payloadNota = `${dataStringa} | Msg: ${msg} | Color: ${coloreSelezionato} | Email: ${utenteCorrente} | Promo: ${codiceScontoApplicato || 'None'}`;
                        
                        window.open(`https://paypal.me/nickpetru/${prezzoAttuale}?note=${encodeURIComponent(payloadNota)}`, "_blank");
                        modalAcquisto.style.display = 'none';
                    };
                });
                
                pixel.addEventListener('mouseenter', () => {
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`${dataStringa} (Available)`, rect);
                });
            }

            tabellone.appendChild(pixel);
        }

        document.addEventListener('click', () => {
            tooltip.style.display = 'none';
        });

        document.getElementById('btn-chiudi').onclick = () => modalAcquisto.style.display = 'none';
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
            
