(function() {
    const tabellone = document.getElementById('tabellone');
    const tooltip = document.getElementById('tooltip');
    const modal = document.getElementById('modal-acquisto');
    const counter = document.getElementById('counter');
    const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzDegTFimnMMFQsdTukR360jPfk3byurBwo_GPfiPKGVQ3UAwiZ8CqmiF9PoINOhxpf/exec";

    // Palette colori casuali
    const palette = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A8', '#33FFF3'];

    let dataCorrenteVisualizzata = new Date();

    function formattaDataItaliana(data) {
        let d = new Date(data);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    // Funzione centralizzata per posizionare il tooltip ovunque (mouse o touch) evitando i bordi
    function mostraTooltip(testoHtml, x, y) {
        tooltip.innerHTML = testoHtml;
        tooltip.style.display = 'block';

        const tooltipWidth = tooltip.offsetWidth || 160;
        const tooltipHeight = tooltip.offsetHeight || 60;
        const padding = 15;

        let posX = x + 10;
        let posY = y + 10;

        // Se esce dal bordo destro dello schermo, spostalo a sinistra
        if (posX + tooltipWidth > window.innerWidth - padding) {
            posX = x - tooltipWidth - 10;
        }

        // Se esce dal bordo inferiore, spostalo leggermente sopra
        if (posY + tooltipHeight > window.innerHeight - padding) {
            posY = y - tooltipHeight - 10;
        }

        tooltip.style.left = posX + 'px';
        tooltip.style.top = posY + 'px';
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
            // Aggiorna contatore
            counter.innerText = `Pixels claimed: ${datiVenduti.size}/400`;
        } catch (e) { console.error("Error:", e); }

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
                
                // Desktop (mouse)
                pixel.addEventListener('mouseenter', (e) => {
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${datiVenduti.get(dataStringa)}`, rect.left + rect.width / 2, rect.top);
                });
                
                // Mobile (touch)
                pixel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = pixel.getBoundingClientRect();
                    mostraTooltip(`<strong>${dataStringa}</strong><br>${datiVenduti.get(dataStringa)}`, rect.left + rect.width / 2, rect.top);
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
                    mostraTooltip(dataStringa, rect.left + rect.width / 2, rect.top);
                });
            }

            pixel.addEventListener('mousemove', (e) => {
                mostraTooltip(tooltip.innerHTML, e.clientX, e.clientY);
            });

            pixel.addEventListener('mouseleave', () => {
                // Su mobile lasciamo il tooltip visibile finché non si clicca altrove, o lo chiudiamo al mouseleave
            });

            tabellone.appendChild(pixel);
        }

        // Chiudi il tooltip se si clicca fuori dai pixel (utile su mobile)
        document.addEventListener('click', () => {
            tooltip.style.display = 'none';
        });
            
