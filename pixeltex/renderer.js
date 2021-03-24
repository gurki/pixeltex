import * as Tokenizer from './tokenizer.js'
import * as Parser from './parser.js'
import * as Rasterizer from './rasterizer.js'


const margin = 20;
const maxSize = 8;

const colors = {
    red: "#a02834",
    green: "#63c64d",
    yellow: "#ffe762",
    orange: "#fb922b",
    cyan: "#2ce8f4",
    gray: "#afbfd2",
    white: "#fcfefa",
    darkgray: "#2e3d4c"
};


////////////////////////////////////////////////////////////////////////////////
function renderAt( node, context, size, fill=undefined ) {

    if ( fill ) context.fillStyle = fill;
    else if ( node.nodeType === Parser.NodeTypes.UNARY ) context.fillStyle = colors.gray;
    else if ( node.tokenType === Tokenizer.Types.FUNCTION ) context.fillStyle = colors.gray;
    else if ( node.tokenType === Tokenizer.Types.NUMERAL ) context.fillStyle = colors.yellow;
    else if ( node.tokenType === Tokenizer.Types.LETTER ) context.fillStyle = colors.white;
    else if ( node.tokenType === Tokenizer.Types.GREEK_LETTER ) context.fillStyle = colors.white;
    else if ( node.tokenType === Tokenizer.Types.MATH ) context.fillStyle = colors.cyan;
    else if ( node.token && ( node.token.data in Tokenizer.BracketLookup ) ) context.fillStyle = colors.green;
    else if ( node.tokenType === Tokenizer.Types.PUNCTUATION ) context.fillStyle = colors.cyan;
    else if ( node.tokenType === Tokenizer.Types.SMILEY ) context.fillStyle = colors.yellow;
    else if ( node.tokenType === Tokenizer.Types.EMOJI ) context.fillStyle = colors.yellow;
    else if ( node.nodeType === Parser.NodeTypes.FRACTION ) context.fillStyle = colors.green;
    else if ( node.nodeType === Parser.NodeTypes.GROUP ) context.fillStyle = colors.green;
    else context.fillStyle = colors.white;

    const offx = node.rect.x * size;
    const offy = node.rect.y * size;

    for ( const coord of node.coords ) {
        const currx = Math.floor( offx + coord.x * size );
        const curry = Math.floor( offy + coord.y * size );
        context.fillRect( currx, curry, size, size );
    }

    for ( const child of node.children ) {
        renderAt( child, context, size );
    }

}


////////////////////////////////////////////////////////////////////////////////
export function render( node, context ) {

    const w = context.canvas.width;
    const h = context.canvas.height;
    const cx = Math.floor( 0.5 * w );
    const cy = Math.floor( 0.5 * h );

    if ( ! node ) {
    //     context.fillStyle = colors.red;
    //     context.textAlign = "center";
    //     context.font = "32px sans-serif";
    //     context.fillText( "invalid expression", cx, cy );
        return;
    }

    const size = Math.min( Math.floor( ( w - 2 * margin ) / node.rect.width ), maxSize );

    const x0 = Math.ceil( cx / size - 0.5 * node.rect.width );
    const y0 = Math.ceil( cy / size - 0.5 * node.rect.height );

    Rasterizer.translateAll( node, x0, y0 );

    renderAt( node, context, size );

}