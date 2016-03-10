module.exports = class
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