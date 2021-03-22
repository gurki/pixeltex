// import * as Parser from './parser.js'
// import * as Tokenizer from './tokenizer.js'


const margin = 20;
const maxSize = 8;


function renderAt( node, context, x, y, size ) {

    const offx = node.rect.x * size;
    const offy = node.rect.y * size;

    // console.log( node.nodeType, node.rect, node.coords, x + offx, y + offy );

    for ( const coord of node.coords ) {
        const currx = Math.floor( x + offx + coord.x * size );
        const curry = Math.floor( y + offy + coord.y * size );
        context.fillRect( currx, curry, size, size );
    }

    for ( const child of node.children ) {
        renderAt( child, context, x + offx, y + offy, size );
    }

}


export function render( node, context ) {

    if ( ! node ) return;

    const w = context.canvas.width;
    const h = context.canvas.height;
    const cx = Math.floor( 0.5 * w );
    const cy = Math.floor( 0.5 * h );
    const size = Math.min( Math.floor( ( w - 2 * margin ) / node.rect.width ), maxSize );

    const x0 = cx - Math.ceil( 0.5 * node.rect.width * size );
    const y0 = cy - Math.ceil( 0.5 * node.rect.height * size );

    renderAt( node, context, x0, y0, size );

}