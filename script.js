(function() {
    const tabellone = document.getElementById('tabellone');
    const tooltip = document.getElementById('tooltip');
    const modalAcquisto = document.getElementById('modal-acquisto');
    const modalAccount = document.getElementById('modal-account');
    const pixelCountSpan = document.getElementById('pixel-count');
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbxtNC_Zvp7Jtbiw__xv6F_Si9OCOXLtQvmnLITrkk6L_ooWm_TxZGwh2q5wBVtF6vIq/exec";

    let dataCorrenteVisualizzata = new Date();
    let coloreSelezionato = "#38bdf8";
    let prezzoAttuale = 1.00; // Prezzo base a 1 euro
    let codiceScontoApplicato = "";

    let utenteCorrente = localStorage.getItem('tc_user_email') || null;

    const btnApriAccount = document.getElementById('btn-apri-account');
    function aggiornaStatoAccountUI() {
        if (utenteCorrente) {
            btnApriAccount.classList.add('logged');
            btnApriAccount.title = `Logged as ${utenteCorrente} (Click to Logout)`;
        } else {
            btnApriAccount.classList.remove('logged');
            btnApriAccount.title = "Account";
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
            accTitle.innerText = "USER ACCOUNT";
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

    btnPromo.addEventListener('click', async () => {
        const codiceInserito = inputPromo.value.trim().toUpperCase();
        
        if (!codiceInserito) {
            promoFeedback.style.color = "#ef4444";
            promoFeedback.innerText = "Please enter a promo code";
            return;
        }

        promoFeedback.style.color = "#e0f2fe";
        promoFeedback.innerText = "Checking promo code...";

        try {
            const response = await fetch(`${GOOGLE_API_URL}?action=sconti`);
            const listaSconti = await response.json();
            
            const trovato = listaSconti.find(s => s.codice === codiceInserito);

            if (trovato) {
                let valoreSconto = parseFloat(trovato.valore);
                
                if (valoreSconto < 1) {
                    prezzoAttuale = valoreSconto;
                } else if (valoreSconto <= 100) {
                    prezzoAttuale = 1.00 * (1 - (valoreSconto / 100));
                } else {
                    prezzoAttuale = valoreSconto;
                }

                codiceScontoApplicato = codiceInserito;
                prezzoFinaleSpan.innerText = prezzoAttuale.toFixed(2) + "€";
                promoFeedback.style.color = "#22c55e";
                promoFeedback.innerText = `Promo applied! (${trovato.valore} off)`;
                document.getElementById('btn-conferma').innerText = prezzoAttuale === 0 ? "CLAIM FOR FREE" : `PAY ${prezzoAttuale.toFixed(2)}€`;
            } else {
                prezzoAttuale = 1.00;
                codiceScontoApplicato = "";
                prezzoFinaleSpan.innerText = "1.00€";
                promoFeedback.style.color = "#ef4444";
                promoFeedback.innerText = "Invalid promo code";
                document.getElementById('btn-conferma').innerText = "PAY 1.00€";
            }
        } catch (error) {
            console.error("Errore verifica sconto:", error);
            promoFeedback.style.color = "#ef4444";
            promoFeedback.innerText = "Error checking promo";
        }
    });

    function formattaDataItaliana(data) {
        let d = new Date(data);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function applicaStileTooltipDinamico(coloreHex) {
        let hex = coloreHex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = yiq >= 128 ? '#09090b' : '#f8fafc';
        
        tooltip.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.85)`;
        tooltip.style.color = textColor;
        tooltip.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
    }

    function mostraTooltip(testoHtml, pixelRect, colorePixel = null) {
        tooltip.innerHTML = testoHtml;
        
        if (colorePixel) {
            applicaStileTooltipDinamico(colorePixel);
        } else {
            tooltip.style.backgroundColor = 'rgba(24, 24, 27, 0.9)';
            tooltip.style.color = '#e0f2fe';
            tooltip.style.borderColor = 'var(--border-color)';
        }

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

    // GESTIONE DEL RITORNO DA STRIPE (CON PASSAGGIO CORRETTO DEI PARAMETRI)
    window.addEventListener("DOMContentLoaded", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const pixel = urlParams.get("pixel");
        
        if (pixel) {
            const msg = urlParams.get("msg");
            const color = urlParams.get("color");
            const email = urlParams.get("email");
            
            try {
                const urlSalvataggio = `${GOOGLE_API_URL}?action=salva&data=${encodeURIComponent(pixel)}&messaggio=${encodeURIComponent(msg)}&colore=${encodeURIComponent(color)}&email=${encodeURIComponent(email)}`;
                await fetch(urlSalvataggio);
                
                alert("Payment successful! Your pixel has been registered on the Time Capsule.");
                window.history.replaceState({}, document.title, window.location.pathname);
                caricaPixel();
            } catch (err) {
                console.error("Errore salvataggio post-pagamento:", err);
            }
        }
    });

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
            if (pixelCountSpan) pixelCountSpan.innerText = datiVenduti.size;
        } catch (e) {
            console.error("Errore caricamento dati:", e);
            if (pixelCountSpan) pixelCountSpan.innerText = "0";
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
                    let infoExtra = eMioPixel ? `<br><span style="font-weight:bold; opacity: 0.9;">[YOUR PIXEL - Click to Edit]</span>` : "";
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${pixelData.messaggio}${infoExtra}`, rect, pixelData.colore);
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
                        document.getElementById('btn-conferma').onclick = async () => {
                            const msgUpdate = document.getElementById('input-messaggio').value || "Updated message";
                            const btnConferma = document.getElementById('btn-conferma');
                            btnConferma.innerText = "Updating...";
                            btnConferma.disabled = true;

                            try {
                                const urlUpdate = `${GOOGLE_API_URL}?action=salva&data=${encodeURIComponent(dataStringa)}&messaggio=${encodeURIComponent(msgUpdate)}&colore=${encodeURIComponent(coloreSelezionato)}&email=${encodeURIComponent(utenteCorrente)}`;
                                await fetch(urlUpdate);
                                modalAcquisto.style.display = 'none';
                                alert("Pixel updated successfully!");
                                caricaPixel();
                            } catch (err) {
                                console.error("Errore aggiornamento:", err);
                                alert("Error updating pixel.");
                            } finally {
                                btnConferma.disabled = false;
                            }
                        };
                    } else {
                        mostraTooltip(`<strong>${dataStringa}</strong><br>${pixelData.messaggio}`, rect, pixelData.colore);
                    }
                });
            } else {
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.style.display = 'none';

                    if (!utenteCorrente) {
                        isModalLoginMode = false;
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
                    prezzoFinaleSpan.innerText = "1.00€";
                    codiceScontoApplicato = "";
                    document.getElementById('promo-section').style.display = 'block';
                    document.getElementById('btn-conferma').innerText = "PAY 1.00€";
                    
                    modalAcquisto.style.display = 'flex';
                    
                    document.getElementById('btn-conferma').onclick = async () => {
                        const msg = document.getElementById('input-messaggio').value || "No message";
                        const btnConferma = document.getElementById('btn-conferma');
                        
                        if (prezzoAttuale === 0) {
                            btnConferma.innerText = "Claiming...";
                            btnConferma.disabled = true;

                            try {
                                const urlSalvataggio = `${GOOGLE_API_URL}?action=salva&data=${encodeURIComponent(dataStringa)}&messaggio=${encodeURIComponent(msg)}&colore=${encodeURIComponent(coloreSelezionato)}&email=${encodeURIComponent(utenteCorrente)}`;
                                await fetch(urlSalvataggio);

                                modalAcquisto.style.display = 'none';
                                alert("Pixel claimed successfully! Added to the grid.");
                                caricaPixel();
                            } catch (err) {
                                console.error("Errore salvataggio:", err);
                                alert("Error saving pixel.");
                            } finally {
                                btnConferma.disabled = false;
                            }
                        } else {
                            btnConferma.innerText = "Redirecting to Stripe...";
                            btnConferma.disabled = true;

                            try {
                                const successRedirectUrl = `${window.location.href.split('?')[0]}?pixel=${encodeURIComponent(dataStringa)}&msg=${encodeURIComponent(msg)}&color=${encodeURIComponent(coloreSelezionato)}&email=${encodeURIComponent(utenteCorrente)}`;

                                const response = await fetch(GOOGLE_API_URL, {
                                    method: "POST",
                                    body: JSON.stringify({
                                        action: "create_checkout",
                                        amount: Math.round(prezzoAttuale * 100), // Converte il prezzo corrente in centesimi (es. 1.00 -> 100)
                                        pixelId: dataStringa,
                                        messaggio: msg,
                                        colore: coloreSelezionato,
                                        email: utenteCorrente,
                                        locale: "auto",
                                        successUrl: successRedirectUrl,
                                        cancelUrl: window.location.href
                                    })
                                });
                                const dataRes = await response.json();
                                if (dataRes.status === "success" && dataRes.url) {
                                    window.location.href = dataRes.url;
                                } else {
                                    alert("Error creating payment session: " + (dataRes.message || "Unknown error"));
                                    btnConferma.disabled = false;
                                    btnConferma.innerText = `PAY ${prezzoAttuale.toFixed(2)}€`;
                                }
                            } catch (err) {
                                console.error("Errore Stripe:", err);
                                alert("Network error while connecting to Stripe.");
                                btnConferma.disabled = false;
                                btnConferma.innerText = `PAY ${prezzoAttuale.toFixed(2)}€`;
                            }
                        }
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
