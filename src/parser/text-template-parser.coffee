Rivets.TextTemplateParser = class
    @types: text: 0, binding: 1
    @parse: (template) -> (template.match(Rivets.STRING_TEMPLATE_REGEXP) ? []).map (m) => type: @types.text, value: m
    @replace: (obj, template) ->
      for match in @parse template
        value = match.value
        template = template.replace value, obj[ value.replace /[\{\}]/g, '' ]

      template