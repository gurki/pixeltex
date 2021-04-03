import { MiniGent, getSize } from '../font/minigent.js'


function pathFromBits( bits ) {

    const path = new opentype.Path();
    const size = getSize( bits );

    const box = { xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity };

    for ( let dy = 0; dy < size.rows; dy++ ) {
        for ( let dx = 0; dx < size.cols; dx++ ) {

            const id = dy * size.cols + dx;
            if ( ! bits[ id ] ) continue;

            path.moveTo(       dx * 100, 400 - dy * 100 );
            path.lineTo( 100 + dx * 100, 400 - dy * 100 );
            path.lineTo( 100 + dx * 100, 300 - dy * 100 );
            path.lineTo(       dx * 100, 300 - dy * 100 );
            path.close();

            box.xMin = Math.min( dx, box.xMin );
            box.yMin = Math.min( dy, box.yMin );
            box.xMax = Math.max( dx, box.xMax );
            box.yMax = Math.max( dy, box.yMax );

        }
    }

    return { path: path, box: box };

}


function convertJsonFont( data ) {

    const notdefGlyph = new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        advanceWidth: 300,
        path: new opentype.Path(),
    });

    let glyphs = [ notdefGlyph ];
    let count = 0;

    for ( const setName in data ) {

        const set = data[ setName ];

        for ( const item of Object.values( set ) ) {

            const path = pathFromBits( item.bits );
            const unicode = parseInt( item.unicode.substr( 2 ), 16 );

            const glyph = new opentype.Glyph({
                name: item.name,
                index: count++,
                unicode: unicode,
                advanceWidth: 100 * ( path.box.xMax + 2 ),
                xMin: 100 * path.box.xMin,
                yMin: 100 * path.box.yMin,
                xMax: 100 * path.box.xMax,
                yMax: 100 * path.box.yMax,
                path: path.path,
            });

            glyphs.push( glyph );

        }

    }

    const font = new opentype.Font({
        familyName: 'MiniGent',
        styleName: 'Regular',
        unitsPerEm: 400,
        ascender: 400,
        descender: -100,
        glyphs: glyphs,
        designer: "Tobias Gurdan",
        designerURL: "github.com/gurki/pixeltex",
        license: "CC-BY 4.0",
        version: "1.1",
        description: "A (mostly) 3x4 pixel font for tiny rich text and math typesetting"
    });

    return font;

}


const font = convertJsonFont( MiniGent );
font.download();