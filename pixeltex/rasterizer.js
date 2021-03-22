import { GentFont } from '../font.js'
import * as Parser from './parser.js'
import * as Tokenizer from './tokenizer.js'
import BoundingRect from './boundingrect.js'


const spacing = 1;


function createPixmapNode( nodeType ) {
    return {
        rect: new BoundingRect(),
        coords: [],
        children: [],
        nodeType: nodeType,
        tokenType: undefined,
    }
}


function rasterizeSymbol( node ) {

    const token = node.token;
    let pixmap = createPixmapNode( node.type );

    if ( token.type == Tokenizer.Types.SPACE ) {
        pixmap.rect.maxx = 3;
        return pixmap;
    }

    //  invalid symbol
    if ( ! ( token.type in GentFont ) ) return pixmap;

    pixmap.tokenType = token.type;
    const letter = GentFont[ token.type ][ token.data ];

    if ( ! letter ) return pixmap;

    const cols = ( letter.bits.length >= 12 ) ? 3 : 2;
    const rows = ( letter.bits.length / cols );

    for ( let dy = 0; dy < rows; dy++ ) {
        for ( let dx = 0; dx < cols; dx++ ) {
            const id = dy * cols + dx;
            if ( ! letter.bits[ id ] ) continue;
            pixmap.coords.push( { x: dx, y: dy} );
            pixmap.rect.include( dx, dy );
        }
    }

    const ox = pixmap.rect.x;
    const oy = pixmap.rect.y;
    pixmap.coords = pixmap.coords.map( c => { return { x: c.x - ox, y: c.y - oy }; } );
    return pixmap;

}


function rasterizeWord( node ) {

    let pixmap = createPixmapNode( node.type );
    let x = 0;

    for ( const symbol of node.children ) {

        const symbolPixmap = rasterizeSymbol( symbol );
        symbolPixmap.rect.translateX( x );
        x += symbolPixmap.rect.width + spacing;

        pixmap.children.push( symbolPixmap );
        pixmap.rect.includeRect( symbolPixmap.rect );

    }

    return pixmap;

}


function rasterizeChildren( node ) {

    let pixmap = createPixmapNode( node.type );

    for ( const child of node.children ) {
        const childPixmap = rasterize( child );
        if ( ! childPixmap ) continue;
        pixmap.children.push( childPixmap );
        pixmap.rect.includeRect( childPixmap.rect );
    }

    return pixmap;

}


function rasterizeArgument( node ) {
    return rasterizeChildren( node );
}


function rasterizeFraction( node ) {

    const nom = rasterizeArgument( node.children[0] );
    const den = rasterizeArgument( node.children[1] );

    console.log( "TYPE:", node.type );
    console.log( den.rect.y );
    nom.rect.translateY( -nom.rect.y );
    den.rect.translateY( nom.rect.bottom - den.rect.y + 4 );

    console.log( "nom:", nom );
    console.log( "den:", den );
    console.log( nom.rect.y, nom.rect.height, nom.rect.bottom, den.rect.y );

    let pixmap = createPixmapNode( node.type );
    pixmap.rect.maxx = Math.max( nom.rect.width, den.rect.width );
    pixmap.rect.maxy = Math.max( nom.rect.height, den.rect.height );

    nom.rect.translateX( 1 + Math.floor( 0.5 * ( pixmap.rect.width - nom.rect.width )));
    den.rect.translateX( 1 + Math.floor( 0.5 * ( pixmap.rect.width - den.rect.width )));
    pixmap.children.push( nom );
    pixmap.children.push( den );

    const ly = nom.rect.bottom + 2;
    pixmap.rect.maxx += 1;

    for ( let lx = 0; lx < pixmap.rect.width; lx++ ) {
        pixmap.coords.push( { x: lx, y: ly } );
    }

    return pixmap;

}


function rasterizeExpression( node ) {
    return rasterizeChildren( node );
}


export function rasterize( node ) {
    if ( ! node ) return undefined;
    if ( node.type == Parser.NodeTypes.SYMBOL ) return rasterizeSymbol( node );
    if ( node.type == Parser.NodeTypes.WORD ) return rasterizeWord( node );
    if ( node.type == Parser.NodeTypes.ARGUMENT ) return rasterizeArgument( node );
    if ( node.type == Parser.NodeTypes.GROUP ) return rasterizeGroup( node );
    if ( node.type == Parser.NodeTypes.COMMAND ) return rasterizeCommand( node );
    if ( node.type == Parser.NodeTypes.UNARY ) return rasterizeUnary( node );
    if ( node.type == Parser.NodeTypes.FRACTION ) return rasterizeFraction( node );
    if ( node.type == Parser.NodeTypes.EXPRESSION ) return rasterizeExpression( node );
    if ( node.type == Parser.NodeTypes.TERMINAL ) return rasterizeTerminal( node );
    return undefined;
}