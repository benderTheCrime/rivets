module.exports = (Rivets) ->
  class
    @types: text: 0, binding: 1

    @parse: (template) ->
      (template.match(Rivets.STRING_TEMPLATE_REGEXP) ? []).map (m) =>
        type: @types.text, value: m