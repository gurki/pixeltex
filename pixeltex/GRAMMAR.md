symbol      -> LETTER | GREEK_LETTER | NUMERAL | PUNCTUATION | SMILEY | EMOJI | MATH | SPACE
word        -> symbol [word]
group       -> OPEN* [expression] CLOSE*
command     -> FUNCTION | SUBSCRIPT | SUPERSCRIPT | OVER | UNDER
argument    -> START [expression] END
unary       -> command ( symbol | argument )
fraction    -> FRACTION argument argument
terminal    -> word | argument | group | unary | fraction
expression  -> [terminal] [expression]