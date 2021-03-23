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


function rasterizeChildren( node ) {

    if ( ! node ) return undefined;
    let pixmap = createPixmapNode( node.type );
    let x = 0;

    for ( const child of node.children ) {

        const childPixmap = rasterize( child );
        if ( ! childPixmap ) continue;

        translateAll( childPixmap, x - childPixmap.rect.x, 0 );
        x += childPixmap.rect.width + spacing;

        pixmap.children.push( childPixmap );
        pixmap.rect.includeRect( childPixmap.rect );

    }

    return pixmap;

}


export function translateAll( node, dx, dy ) {
    if ( ! node ) return;
    node.rect.translate( dx, dy );
    for ( const child of node.children ) {
        translateAll( child, dx, dy );
    }
}


function removeTranslation( node ) {
    translateAll( node, -node.rect.x, -node.rect.y );
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
    return rasterizeChildren( node );
}


function rasterizeArgument( node ) {
    return rasterizeChildren( node );
}


function rasterizeFraction( node ) {

    const nom = rasterizeArgument( node.children[0] );
    const den = rasterizeArgument( node.children[1] );

    if ( ! nom || ! den ) return;

    removeTranslation( nom );
    removeTranslation( den );
    translateAll( den, 0, nom.rect.height + 3 );

    let pixmap = createPixmapNode( node.type );
    pixmap.rect.maxx = 1 + Math.max( nom.rect.width, den.rect.width );
    pixmap.rect.maxy = nom.rect.height + 2 + den.rect.height;
    pixmap.rect.count = 8;

    translateAll( nom, Math.ceil( 0.5 * ( pixmap.rect.width - nom.rect.width )), 0 );
    translateAll( den, Math.ceil( 0.5 * ( pixmap.rect.width - den.rect.width )), 0 );
    pixmap.children.push( nom );
    pixmap.children.push( den );

    const ly = nom.rect.height + 1;

    // pixmap.coords.push( { x: pixmap.rect.x, y: pixmap.rect.y } );

    for ( let lx = 0; lx < pixmap.rect.width; lx++ ) {
        pixmap.coords.push( { x: lx, y: ly } );
    }

    // pixmap.coords.push( { x: pixmap.rect.right, y: pixmap.rect.bottom } );
    translateAll( pixmap, 0, 2 - ly );

    return pixmap;

}


function rasterizeExpression( node ) {
    const exp = rasterizeChildren( node );
    removeTranslation( exp );
    return exp;
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