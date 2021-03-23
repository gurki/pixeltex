symbol      -> LETTER | GREEK_LETTER | NUMERAL | PUNCTUATION | SMILEY | EMOJI | MATH | SPACE
word        -> symbol [word]
group       -> OPEN* [expression] CLOSE*
argument    -> START [expression] END
operand     -> symbol | argument
unary       -> ( FUNCTION | OVER | UNDER ) operand
script      -> expression [SUBSCRIPT operand] [SUPERSCRIPT operand]
fraction    -> FRACTION argument argument
terminal    -> word | argument | group | fraction | unary | script
expression  -> [terminal] [expression]