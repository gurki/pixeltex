symbol: LETTER | GREEK_LETTER | NUMERAL | PUNCTUATION | SMILEY | EMOJI | MATH
word: symbol | symbol word
argument: START expression END
command: "\\" word
script: SUBSCRIPT | SUPERSCRIPT
optional: script symbol | script argument
unary: command argument
fraction: FRACTION argument argument
brackets: OPEN expression CLOSE
expression: terminal expression | terminal
terminal : word | unary | optional | FRACTION | brackets