const width = 8;
const candyColors = ['color-0', 'color-1', 'color-2', 'color-3', 'color-4', 'color-5'];
let squares = [];

for (let i = 0; i < 64; i++) {
    let randomColor = Math.floor(Math.random() * candyColors.length);
    squares.push({
        classList: {
            0: 'tile',
            1: candyColors[randomColor],
            contains: function(c) {
                return this[0] === c || this[1] === c;
            }
        },
        set className(val) {
            let parts = val.split(' ');
            this.classList[0] = parts[0];
            this.classList[1] = parts[1];
        }
    });
}

function checkMatchesOnStart() {
    let hasMatch = true;
    let iterations = 0;
    while(hasMatch) {
        iterations++;
        if (iterations > 1000) {
            console.log("Infinite loop detected!");
            return;
        }
        hasMatch = false;
        // Check rows
        for (let i = 0; i < 64; i++) {
            let rowOfThree = [i, i+1, i+2];
            let decidedColor = squares[i].classList[1];
            const isBlank = !decidedColor;
            const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
            if (notValid.includes(i)) continue;

            if (rowOfThree.every(index => squares[index].classList.contains(decidedColor) && !isBlank)) {
                hasMatch = true;
                squares[i].className = 'tile ' + candyColors[Math.floor(Math.random() * candyColors.length)];
            }
        }
        // Check columns
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i+width, i+width*2];
            let decidedColor = squares[i].classList[1];
            const isBlank = !decidedColor;
            if (columnOfThree.every(index => squares[index].classList.contains(decidedColor) && !isBlank)) {
                hasMatch = true;
                squares[i].className = 'tile ' + candyColors[Math.floor(Math.random() * candyColors.length)];
            }
        }
    }
    console.log("Done in " + iterations + " iterations");
}

try {
    checkMatchesOnStart();
} catch (e) {
    console.log("Error:", e.message);
}
