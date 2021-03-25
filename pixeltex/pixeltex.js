import { MiniGent } from '../font/minigent.js'
import * as Tokenizer from './tokenizer.js'
import * as Parser from './parser.js'
import * as Rasterizer from './rasterizer.js'
import * as Renderer from './renderer.js'


var app = new Vue({

    data: {
        font: MiniGent,
        codes: {},
        input: "HELLO THERE! :grinning:\n\nThis is PIXELTEX.\nIt uses the 3x4 MINIGENT font.\nClick through the examples\nbelow to see what it can do :stuck_out_tongue_winking_eye:.\n\nENJOY AND HAVE FUN!",
    },

    watch: {},
    computed: {},
    filters: {},
    methods: {
        inputChanged() {

            const canvasWidth = this.ctx.canvas.clientWidth;
            const canvasHeight = this.ctx.canvas.clientHeight;

            this.ctx.fillStyle = "#2c2f3a";
            this.ctx.fillRect( 0, 0, canvasWidth, canvasHeight );

            const tokens = Tokenizer.tokenize( this.input, this.codes );
            const ast = Parser.parse( tokens );
            const fb = Rasterizer.rasterize( ast );
            Renderer.render( fb, this.ctx );

        },
        saveImage() {
            const canvas = document.getElementById( "tex-canvas" );
            const link = document.getElementById( 'link' );
            link.setAttribute( 'download', 'PixelTexRender.png' );
            link.setAttribute( 'href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream") );
            link.click();
        },
        clear() {
            this.input = '';
        },
        showExample( id ) {
            if ( id == 1 ) this.input = "This is the regular FONT.\nYou get RESULTS in real-time.\nSCALE adjusted on the fly.\n\nLINE BREAKS work as expected.";
            if ( id == 2 ) this.input = "GREEK LETTERS?\n\n\\alpha\\beta\\gamma\\delta\\xi\\omega \\Alpha\\Beta\\Gamma\\Xi\\Delta\\Omega\n\nNICE :thumbsup:";
            if ( id == 3 ) this.input = "There's a whole ton of\nsymbols as well! Including:\n\n\\pm\\neq\\partial\\nabla\\forall\\therefore\\propto\\permil\\measuredangle\\nmid\\cent\\yen\\currency\n\nYou can even do logic stuff:\n\nG(\\negx)\\rightarrow\\forall(\\exists\\phi:P(\\phi)\\rightarrow\\phi(x))";
            if ( id == 4 ) this.input = "Oh yeah you heard right :smirk:\n\nHm? :raised_eyebrow:\nOooh! :astonished:\nSo koool ... :drooling_face:\nLove it! :heart:\n:thumbsup: :ok_hand:";
            if ( id == 5 ) this.input = "Basic LaTeX support incl. \\left(brackets\\right), \\sqrt{root},\n\\frac{frac}{tions}, commands like \\cos, \\log, \\lim, \\sum, \\prod, \\int_{},\n\\overline{over}- & \\underline{under}line, and _{sub}/^{super}script.\nThere's also some color coding :grinning:.\n\nEquation 1.                                                       \na) c=\\pm\\sqrt{a^2+b^2}\nb) \\overline{\\gamma_i}:=1+\\left(\\frac{x}{y}\\right)^2";
            if ( id == 6 ) this.input = "what's happening ...\n\n\n\\sqrt{3\\left(\\frac{\\frac{a}{\\left(\\theta+\\overline{\\omega}\\right)x_n}}{\\log{b}}\\right)^2_i}=4\\sum_{i=0}^{n}(u_i\\cdotv_i)+\\int_1^3x\\dx-\\left(\\lim_{n\\rightarrow\\infty}\\frac{\\overline{\\gamma\\xi}}{n^{-2}}\\right)";
        }
    },
    watch: {
        input: function( val ) { this.inputChanged(); }
    },
    mounted() {
        let canvas = document.getElementById( "tex-canvas" );
        this.ctx = canvas.getContext( '2d' );
        this.ctx.imageSmoothingEnabled = false
        this.inputChanged();
    }

});

app.$mount( "#app" );