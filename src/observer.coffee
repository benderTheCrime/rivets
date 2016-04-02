class Observer
  constructor: ->
    @id = '_'
    @counter = 0
    @weakmap = {}

  observe: (obj, keypath, callback) ->
    @obj = obj
    @keypath = keypath
    callbacks = @weakReference(obj).callbacks

    value = @walkObjectKeypath obj, keypath

    parentKeypath = keypath.split '.'
    key = parentKeypath.pop()

    parentKeypath = parentKeypath.join '.'
    parentValue = @walkObjectKeypath obj, parentKeypath

    unless callbacks[ keypath ]?
      callbacks[ keypath ] = []

    delete parentValue[ key ];
    Object.defineProperty parentValue, key,
      enumerable: true
      configurable: true
      get: -> value
      set: (newValue) =>
        if newValue isnt value
          value = newValue
          @observe obj, keypath, callback
          cb() for cb in callbacks[ keypath ]

    unless callback in callbacks[ keypath ]
      callbacks[ keypath ].push callback

    @observeMutations value, obj[@id], key

  weakReference: (obj) ->
    unless obj.hasOwnProperty @id
      id = @counter++
      Object.defineProperty obj, @id, value: id

    @weakmap[obj[@id]] or= callbacks: {}

  observeMutations: (obj, ref, keypath) ->
    if Array.isArray obj
      map = @weakReference obj

      unless map.pointers?
        map.pointers = {}
        functions = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice']
        @stubFunction obj, fn for fn in functions

      map.pointers[ref] ?= []

      unless keypath in map.pointers[ref]
        map.pointers[ref].push keypath

  stubFunction: (obj, fn) ->
    original = obj[fn]
    map = @weakReference obj
    weakmap = @weakmap

    obj[fn] = ->
      response = original.apply obj, arguments

      for r, k of map.pointers
        callback() for callback in weakmap[r]?.callbacks[k] ? []

      response

  get: () -> @walkObjectKeypath.call @, @obj, @keypath
  set: (value) -> @walkObjectKeypath.call @, @obj, @keypath, value

  walkObjectKeypath: (obj, keypath, value) ->
    keys = keypath.split '.'
    lastKey = keys.reverse()[ 0 ]
    val = obj

    for key in keys.reverse()
      if key is lastKey and value
        val = val[ key ] = value
      else if val[ key ]?
        val = val[ key ]
      else null

    val