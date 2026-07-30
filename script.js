(function() {
    const tabellone = document.getElementById('tabellone');
    const tooltip = document.getElementById('tooltip');
    const modal = document.getElementById('modal-acquisto');
    const counter = document.getElementById('counter');
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzDegTFimnMMFQsdTukR360jPfk3byurBwo_GPfiPKGVQ3UAwiZ8CqmiF9PoINOhxpf/exec";

    const palette = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#33FFF3'];
    let dataCorrenteVisualizzata = new Date();

    function formattaDataItaliana(data) {
        let d = new Date(data);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function mostraTooltip(testoHtml, pixelRect) {
        tooltip.innerHTML = testoHtml;
        tooltip.style.display = 'block';

        const screenWidth = window.innerWidth;
        const tooltipWidth = 250; // Larghezza massima stimata del tooltip via CSS

        // Posizionamento di base a DESTRA del pixel
        let leftPos = pixelRect.right + 8;
        let topPos = pixelRect.top + window.scrollY;

        // Se a destra non c'è abbastanza spazio, sposta il box a SINISTRA del pixel
        if (leftPos + tooltipWidth > screenWidth - 15) {
            leftPos = pixelRect.left - tooltipWidth - 8;
        }

        // Controllo di sicurezza per non uscire dal bordo sinistro dello schermo
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
                    datiVenduti.set(data, riga[1] || "Purchased!");
                }
            });
            counter.innerText = `Pixels claimed: ${datiVenduti.size}/400`;
        } catch (e) {
            console.error("Errore caricamento dati (continuo comunque a mostrare la griglia):", e);
            counter.innerText = `Pixels claimed: 0/400`;
        }

        // Generazione griglia garantita in ogni caso
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
                const randomColor = palette[Math.floor(Math.random() * palette.length)];
                pixel.style.backgroundColor = randomColor;
                
                pixel.addEventListener('mouseenter', () => {
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${datiVenduti.get(dataStringa)}`, rect);
                });
                
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${datiVenduti.get(dataStringa)}`, rect);
                });
            } else {
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.style.display = 'none';
                    document.getElementById('data-scelta').innerText = `Date: ${dataStringa}`;
                    modal.style.display = 'flex';
                    document.getElementById('btn-conferma').onclick = () => {
                        const msg = document.getElementById('input-messaggio').value || "No message";
                        window.open(`https://paypal.me/nickpetru/2?note=${encodeURIComponent(dataStringa + " - " + msg)}`, "_blank");
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
                tabellone.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out';
                tabellone.style.opacity = '1';
            }, 50);
        }, 600);
    };

    caricaPixel();
})();
