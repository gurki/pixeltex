import { getSize } from '../font/minigent.js'


export function drawLetter( canvas, letter ) {

    let ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const size = getSize( letter.bits );
    const pw = w / 5;
    const ph = h / 5;
    const ox = ( w - size.cols * pw ) / 2;

    ctx.fillStyle = "#FCFEFA";

    for ( let y = 0; y < size.rows; y++ ) {
        for ( let x = 0; x < size.cols; x++ ) {
            const id = x + y * size.cols;
            if ( ! letter.bits[ id ] ) continue;
            ctx.fillRect( ox + x * pw, y * ph, pw, ph );
        }
    }

}