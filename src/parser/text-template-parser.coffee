module.exports = class
  @types: text: 0, binding: 1

  @parse: (template) ->
    (template.match(/\{([a-z0-9\.]+)\}/gi) ? []).map (m) =>
      type: @types.text, value: m