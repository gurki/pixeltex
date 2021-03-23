symbol*     -> LETTER | GREEK_LETTER | NUMERAL | PUNCTUATION | SMILEY | EMOJI | MATH | SPACE
word        -> symbol [word]
group*      -> OPEN* [expression] CLOSE*
argument*   -> START [expression] END
operand     -> symbol | argument
unary*      -> ( FUNCTION | OVER | UNDER ) operand
sub*        -> SUBSCRIPT operand
sup*        -> SUPERSCRIPT operand
base        -> word | argument | group | fraction | unary
script*     -> nonscript ( ( sub [sup] ) | ( sup [sub] ) )
fraction*   -> FRACTION argument argument
terminal    -> script | word | argument | group | fraction | unary
expression* -> terminal [expression]