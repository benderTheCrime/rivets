module.exports = class
  @parse: (str) ->
    obj = type: 0, value: undefined

    if /^'.*'$|^".*"$/.test str
      obj.value = str.slice 1, -1
    else if str is 'true'
      obj.value = true
    else if str is 'false'
      obj.value = false
    else if str is 'null'
      obj.value = null
    else if isNaN(Number str) is false
      obj.value = Number str
    else unless str is 'undefined' or str is ''
      obj.type = 1
      obj.value = str

    obj