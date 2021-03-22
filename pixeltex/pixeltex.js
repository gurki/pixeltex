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

            this.ctx.fillStyle = "#454b61";
            this.ctx.fillRect( 0, 0, canvasWidth, canvasHeight );

            for ( const line of lines ) {

                const tokens = Tokenizer.tokenize( line, this.codes );
                const ast = Parser.parse( tokens );
                const fb = Rasterizer.rasterize( ast );
                console.log( fb );

                this.ctx.fillStyle = "#fcfefa";
                Renderer.render( fb, this.ctx );

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