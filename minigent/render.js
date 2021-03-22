export function drawLetter( canvas, letter ) {

    let ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#FCFEFA";

    const cols = ( letter.bits.length == 6 ) ? 2 : 3;
    const rows = letter.bits.length / cols;
    const pw = w / 5;
    const ph = h / 5;

    const ox = ( w - cols * pw ) / 2;

    for ( let y = 0; y < rows; y++ ) {
        for ( let x = 0; x < cols; x++ ) {
            const id = x + y * cols;
            if ( ! letter.bits[ id ] ) continue;
            ctx.fillRect( ox + x * pw, y * ph, pw, ph );
        }
    }

}