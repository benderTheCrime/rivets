global.Rivets = {}

Observer = require '../../src/observer'
expect = require('chai').expect

describe 'Observer', ->
  obj = null

  describe 'walkObjectKeypath', ->
    beforeEach -> obj =
      foo: 'bar'
      baz: {}
      bing: bo: 'flob'
    describe 'should return the object itself', ->
      it 'no keypath', ->
        expect(Observer.prototype.walkObjectKeypath obj).to.equal obj
      it 'keypath', ->
        expect(Observer.prototype.walkObjectKeypath obj, '').to.equal obj
    describe 'get keypath', ->
      describe 'shallow', ->
        it 'should not find a shallow keypath', ->
          expect(Observer.prototype.walkObjectKeypath obj, 'qux').to.be.null
        it 'should find a keypath', ->
          expect(Observer.prototype.walkObjectKeypath obj, 'foo').to.equal 'bar'
      describe 'deep', ->
        describe 'should not find a deep keypath', ->
          it 'top level undefined', ->
            expect(Observer.prototype.walkObjectKeypath obj, 'qux.quux').to.be.null
          it 'lower level undefined', ->
            expect(Observer.prototype.walkObjectKeypath obj, 'baz.bing').to.equal.null
        it 'should find a deep keypath', ->
          expect(Observer.prototype.walkObjectKeypath obj, 'bing.bo').to.equal 'flob'
    describe 'set keypath', ->
      it 'shallow', ->
        expect(Observer.prototype.walkObjectKeypath obj, 'foo', 'baz').to.equal 'baz'
      describe 'deep', ->
        it 'top level set', ->
          expect(Observer.prototype.walkObjectKeypath obj, 'qux.quux', 'foo').to.equal 'foo'
        it 'lower level set', ->
          expect(Observer.prototype.walkObjectKeypath obj, 'baz.bing', 'foo').to.equal 'foo'


# Test shallow not found
# Test deep not found
# Test shallow found
# Test deep found
# Test set