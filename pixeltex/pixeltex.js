import { GentFont } from '../font.js'
import * as Tokenizer from './tokenizer.js'
import * as Parser from './parser.js'
import * as Rasterizer from './rasterizer.js'
import * as Renderer from './renderer.js'


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

            //  ab
            //  \frac{x}{y}
            //  a\frac{x}{y}b
            //  a\frac{\frac{uv}{w}}{xyz}b
            //  \left(a\frac{\frac{uv}{w}}{xyz}b\right)
            //  \left(a\frac{\frac{uv}{w}}{\sqrt{xyz}}b\right)
            //  \left(1\frac{\left(\frac{2x}{y}\right)}{\sqrt{3}}z\right)
            //  \gamma:=\left(1\frac{\left(\frac{2x}{y}\right)}{\sqrt{3}}z\right)
            this.ctx.fillStyle = "#2c2f3a";
            this.ctx.strokeStyle = "#191d27";
            this.ctx.fillRect( 0, 0, canvasWidth, canvasHeight );
            this.ctx.strokeRect( 0, 0, canvasWidth, canvasHeight );

            for ( const line of lines ) {

                const tokens = Tokenizer.tokenize( line, this.codes );
                const ast = Parser.parse( tokens );
                console.log( ast );
                const fb = Rasterizer.rasterize( ast );
                // console.log( fb );

                Renderer.render( fb, this.ctx );

            }

        }
    },
    mounted() {

        let parent = document.getElementById( "tex-output" );
        let canvas = document.getElementById( "tex-canvas" );

        // canvas.style.width = '100%';
        // canvas.style.height = '100%';
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;

        this.ctx = canvas.getContext( '2d' );
        // this.ctx.canvas.width = canvas.width;
        // this.ctx.canvas.height = canvas.height;
        this.ctx.imageSmoothingEnabled = false
        this.ctx.fillStyle = "#2c2f3a";
        this.ctx.strokeStyle = "#191d27";
        this.ctx.fillRect( 0, 0, canvas.width, canvas.height );
        this.ctx.strokeRect( 0, 0, canvas.width, canvas.height );

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