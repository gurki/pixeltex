import { GentFont } from './font.js'
import * as Tokenizer from './tokenizer.js'


var app = new Vue({

    data: {
        font: GentFont,
        codes: {},
        input: ""
    },

    watch: {},
    computed: {},
    filters: {},
    methods: {
        inputChanged() {

            const lines = this.input.split( '\n' );
            const canvasWidth = this.ctx.canvas.clientWidth;
            const canvasHeight = this.ctx.canvas.clientHeight;

            this.ctx.fillStyle = "#454b61";
            this.ctx.fillRect( 0, 0, canvasWidth, canvasHeight );

            let y = -1;
            let buffer = [];
            let globalRect = { x: 0, y: 0, width: 0, height: 0 };

            for ( const line of lines ) {

                const tokens = Tokenizer.tokenize( line, this.codes );

                console.log( ...tokens );


                y += 1;

                let coords = [];
                let rect = { x: 0, y: y, width: 0, height: 0 }; // top-left anchor
                let x = -1;

                for ( const token of tokens ) {

                    if ( token.type == Tokenizer.Types.SPACE ) {
                        x += 3;
                        continue;
                    }

                    if ( ! ( token.type in GentFont ) ) continue;

                    const letter = GentFont[ token.type ][ token.data ];
                    const cols = ( letter.bits.length >= 12 ) ? 3 : 2;
                    const rows = ( letter.bits.length / cols );

                    let height = 0;
                    x += 1;

                    for ( let dy = 0; dy < rows; dy++ ) {
                        for ( let dx = 0; dx < cols; dx++ ) {
                            const id = dy * cols + dx;
                            if ( ! letter.bits[ id ] ) continue;
                            coords.push( { x: x + dx, y: y + dy } );
                            height = Math.max( dy + 1, height );
                        }
                    }

                    x += cols;
                    rect.height = Math.max( rect.height, height );

                }

                y += rect.height;
                rect.width = x;
                buffer.push({ coords: coords, rect: rect });

                globalRect.width = Math.max( rect.width, globalRect.width );
                globalRect.height = y;

                // console.log( "linebreak", y );

            }

            this.ctx.fillStyle = "#d1d5e0";
            const w2 = 0.5 * canvasWidth;
            const h2 = 0.5 * canvasHeight;

            const size = 8;
            const oy = Math.floor( h2 - 0.5 * size * globalRect.height );

            for ( const item of buffer ) {

                const ox = Math.floor( w2 - 0.5 * size * item.rect.width );

                for ( const coord of item.coords ) {
                    const x = ox + size * coord.x;
                    const y = oy + size * coord.y;
                    this.ctx.fillRect( x, y, size, size );
                }

            }

        }
    },
    mounted() {

        let parent = document.getElementById( "tex-output" );
        let canvas = document.getElementById( "tex-canvas" );

        this.ctx = canvas.getContext( '2d' );
        this.ctx.canvas.width = parent.clientWidth;
        this.ctx.canvas.height = parent.clientHeight;
        this.ctx.imageSmoothingEnabled = false
        this.ctx.fillStyle = "#454b61";
        this.ctx.fillRect( 0, 0, canvas.clientWidth, canvas.clientHeight );

        for ( const category in GentFont ) {
            const cats = GentFont[ category ];
            for ( const key in cats ) {
                const letter = cats[ key ];
                if ( ! ( "code" in letter ) ) continue;
                this.codes[ letter[ "code" ] ] = letter;
            }
        }

    }

});

app.$mount( "#app" );