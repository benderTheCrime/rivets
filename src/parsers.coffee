# Rivets.TypeParser
# ---------------------

# Parser and tokenizer for getting the type and value of a primitive or keypath.
module.exports.TypeParser = class
  @types:
    primitive: 0
    keypath: 1

  @parse: (string) ->
      if /^'.*'$|^".*"$/.test string
        type: @types.primitive
        value: string.slice 1, -1
      else if string is 'true'
        type: @types.primitive
        value: true
      else if string is 'false'
        type: @types.primitive
        value: false
      else if string is 'null'
        type: @types.primitive
        value: null
      else if string is 'undefined'
        type: @types.primitive
        value: undefined
      else if string is ''
        type: @types.primitive
        value: undefined
      else if isNaN(Number(string)) is false
        type: @types.primitive
        value: Number string
      else
        type: @types.keypath
        value: string

# Rivets.TextTemplateParser
# -------------------------

# Rivets.js text template parser and tokenizer for mustache-style text content
# binding declarations.
module.exports.TextTemplateParser = class
  @types:
    text: 0
    binding: 1

  # Parses the template and returns a set of tokens, separating static portions
  # of text from binding declarations.
  @parse: (template, delimiters) ->
    (template.match(/\{([a-z0-9\.]+)\}/gi) ? []).map (m) =>
      type: @types.text
      value: m
