declare module global {
    interface Store {
        active: boolean
    }
}

this.store = {
    active: false
}
this.$api.datastore.import(this.store);

const formatFl = (ft: number) => {
    return `FL${ft / 100}`;
}

const calculateTransitionLevel = (qnh: number, altitude: number): number => {
    let trl = (altitude + ((1013.2 - qnh) * 26.7)) / 100;
    trl = Math.floor(trl);
    let rest = trl % 5;
    if (rest !== 0) {
        trl = trl - rest + 5;
    }

    return trl * 100;
};

const generateTableRows = (from: number = 3000, to: number = 7000) => {
    const rows: string[][] = [];
    for (let i = from; i <= to; i += 500) {
        const adjusted = i + 1500;

        rows.push([
            `${i}`,
            `${formatFl(calculateTransitionLevel(959, adjusted))}`,
            `${formatFl(calculateTransitionLevel(977, adjusted))}`,
            `${formatFl(calculateTransitionLevel(995, adjusted))}`,
            `${formatFl(calculateTransitionLevel(1013, adjusted))}`,
            `${formatFl(calculateTransitionLevel(1031, adjusted))}`,
            `${formatFl(calculateTransitionLevel(1050, adjusted))}`,
            `${formatFl(calculateTransitionLevel(1068, adjusted))}`
        ]);
    }

    return rows;
};

let htmlElement: HTMLElement|null = null;

const toggleElement = () => {
    if (this.store.active) {
        htmlElement?.classList.add('visible');
    } else {
        htmlElement?.classList.remove('visible');
    }
};

html_created((el) => {
    htmlElement = el.querySelector('#ranbogmord-trlcalc');

    toggleElement();

    const tableBody = el.querySelector('tbody');
    const rows = generateTableRows();
    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((col, idx) => {
            const td = document.createElement(idx === 0 ? 'th' : 'td');
            td.innerText = col;
            tr.appendChild(td);
        });
        tableBody?.appendChild(tr);
    });
});

run(() => {
    this.store.active = !this.store.active;
    this.$api.datastore.export(this.store);

    toggleElement();

    return false;
});

style(() => {
    return this.store.active ? 'active' : null;
});

search(['trl'], (query, callback) => {
    if (!query) {
        return;
    }

    const [_, qnhStr, taStr, tlStr] = query.split(' ');
    
    const qnh: number = parseFloat(qnhStr);
    let ta: number = parseInt(taStr);

    if (!qnh || !ta) {
        const res: SearchResult = {
            uid: 'trlcalc-missing-params',
            label: 'Error',
            subtext: '<p>Missing QNH or TA</p><p>Command&colon;<br />trl &lt;QNH&gt; &lt;Transition Altitude&gt; &lsqb;Transition Layer&rsqb;</p>'
        };

        callback([res]);
        return;
    }

    let tl: number|null = null;
    if (tlStr) {
        tl = parseInt(tlStr);
    }

    console.log(tl, tlStr);
    
    if (tl || tl === 0) {
        ta += tl;
    } else {
        ta += 1500; // Default transition layer
    }
    
    const trl = calculateTransitionLevel(qnh, ta);

    callback([{
        uid: `trlcalc-${qnh}-${tl}`,
        label: `Transition Level: ${formatFl(trl)}`
    }])
});