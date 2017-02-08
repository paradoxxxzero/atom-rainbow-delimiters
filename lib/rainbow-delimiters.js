'use babel';

import { CompositeDisposable, Range } from 'atom';
import RainbowDelimitersView from './rainbow-delimiters-view'

const escapeRegExp = str => str.replace(
  /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")


export default {
  subscriptions: null,
  view: null,
  pairs: {
    '{': '}',
    '[': ']',
    '(': ')'
  },

  opens() {
    return Object.keys(this.pairs)
  },

  closes() {
    return this.opens().map( open => this.pairs[open])
  },

  all() {
    return this.opens().concat(this.closes())
  },

  reverse() {
    const reverse = {}
    this.opens().map(open => {
      reverse[this.pairs[open]] = open
    })
    return reverse
  },

  getRegExp() {
    return new RegExp(
      '[' + escapeRegExp(
        this.all().join('')) + ']', 'g')
  },


  highlight(editor, position) {
    this.view.destroy()

    const beforeRange = new Range(
      editor.getBuffer().getFirstPosition(), position)
    const afterRange = new Range(
      position, editor.getBuffer().getEndPosition())

    let stack = [], context = []
    const opens = this.opens(), closes = this.closes()
    const reverse = this.reverse()
    const ignore = range => (
      editor.bufferRangeForScopeAtPosition('.string.quoted', range.end) &&
      !editor.bufferRangeForScopeAtPosition('.template', range.end) ||
      editor.bufferRangeForScopeAtPosition('.comment', range.end) ||
      editor.bufferRangeForScopeAtPosition('.backslash', range.end)
      )

    editor.backwardsScanInBufferRange(
      this.getRegExp(), beforeRange, ({ matchText, range, stop }) => {
        if (ignore(range)) {
          return
        }
        if (closes.find(c => c == matchText)) {
          stack.push(matchText)
          return
        }
        if (stack.length) {
          let current = stack.pop()

          if (reverse[current] != matchText) {
            this.view.add(editor, range, 'error', matchText)
            stop()
          }
          return
        }
        context.push(matchText)
        this.view.add(
          editor, range, context.length, matchText)
    })
    stack = []
    const max = context.length
    editor.scanInBufferRange(
      this.getRegExp(), afterRange, ({ matchText, range, stop }) => {
        if (ignore(range)) {
          return
        }
        if (opens.find(c => c == matchText)) {
          stack.push(matchText)
          return
        }
        if (stack.length) {
          let current = stack.pop()

          if (this.pairs[current] != matchText) {
            this.view.add(editor, range, 'error', matchText)
            stop()
          }
          return
        }
        let previous = context.shift()
        if (this.pairs[previous] != matchText) {
          this.view.add(editor, range, 'error', matchText)
          stop()
        }
        this.view.add(
          editor, range, (max - context.length), matchText)
    })
  },

  activate(state) {
    this.view = new RainbowDelimitersView()
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(
      atom.workspace.observeTextEditors(editor => {
        this.subscriptions.add(editor.onDidChangeCursorPosition(({ cursor }) => {
          this.highlight(editor, cursor.getBufferPosition())
        }))

        this.subscriptions.add(editor.onDidTokenize(() => {
          this.highlight(editor, editor.getCursorBufferPosition())
        }))
      })
    )
  },

  serialize() {},

  deactivate() {
    this.subscriptions.dispose()
    this.view.destroy()
  }
}
