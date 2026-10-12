(() => {
    'use strict';
    const table = document.querySelector('.ca-oblique-rule-table');
    const body = table.tBodies[0];
    const buttons = [...table.querySelectorAll('button[data-sort]')];
    const entries = [...body.rows].map(row => ({
        row,
        no:Number(row.cells[0].textContent),
        dx:Number(row.dataset.dx),
        dy:Number(row.dataset.dy),
        date:row.cells[4].textContent.trim(),
    }));
    let active = 'date', direction = 1;
    for (const button of buttons) {
        button.addEventListener('click', () => {
            const column = button.dataset.sort;
            direction = column === active ? -direction : 1;
            active = column;
            entries.sort((a,b) => {
                const difference = column === 'no' ? a.no-b.no : column === 'slope' ?
                    a.dx*b.dy-b.dx*a.dy : a.date.localeCompare(b.date);
                return direction*difference || a.no-b.no;
            });
            body.append(...entries.map(entry => entry.row));
            for (const item of buttons) {
                item.parentElement.setAttribute('aria-sort', item === button ?
                    direction === 1 ? 'ascending' : 'descending' : 'none');
            }
        });
    }
})();
