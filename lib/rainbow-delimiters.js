'use babel'
/* global atom */

import { CompositeDisposable, Range } from 'atom'

import RainbowDelimitersView from './rainbow-delimiters-view'

const escapeRegExp = str =>
  str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')

export default {
  subscriptions: null,
  view: null,
  timeout: null,
  config: {
    delimiters: {
      type: 'array',
      default: ['{}', '[]', '()'],
      items: {
        type: 'string',
      },
    },
  },

  setDelimiters() {
    const pairs = atom.config.get('rainbow-delimiters.delimiters')
    this.opens = pairs.map(p => p[0])
    this.closes = pairs.map(p => p[1])
    this.all = pairs.join('')
  },

  getRegExp() {
    return new RegExp(`[${escapeRegExp(this.all)}]`, 'g')
  },

  isScopeIgnored(editor, pos) {
    const scopes = editor.scopeDescriptorForBufferPosition(pos).scopes.join('.')
    return (
      (scopes.includes('.string') && !scopes.includes('.template')) ||
      scopes.includes('.comment') ||
      scopes.includes('.backslash')
    )
  },

  highlight(editor, position) {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = setTimeout(() => this._highlight(editor, position), 30)
  },

  _highlight(editor, position) {
    this.timeout = null
    this.view.destroy()

    const beforeRange = new Range(
      editor.getBuffer().getFirstPosition(),
      position
    )
    const afterRange = new Range(position, editor.getBuffer().getEndPosition())

    let stack = []
    const context = []

    editor.backwardsScanInBufferRange(
      this.getRegExp(),
      beforeRange,
      ({ matchText, range, stop }) => {
        if (this.isScopeIgnored(editor, range.start)) {
          return
        }
        if (this.closes.find(c => c === matchText)) {
          stack.push(matchText)
          return
        }
        if (stack.length) {
          const current = stack.pop()

          if (this.opens[this.closes.indexOf(current)] !== matchText) {
            this.view.add(editor, range, 'error', matchText)
            stop()
          }
          return
        }
        context.push(matchText)
        this.view.add(editor, range, context.length, matchText)
      }
    )
    stack = []
    const max = context.length
    editor.scanInBufferRange(
      this.getRegExp(),
      afterRange,
      ({ matchText, range, stop }) => {
        if (this.isScopeIgnored(editor, range.start)) {
          return
        }
        if (this.opens.find(c => c === matchText)) {
          stack.push(matchText)
          return
        }
        if (stack.length) {
          const current = stack.pop()

          if (this.closes[this.opens.indexOf(current)] !== matchText) {
            this.view.add(editor, range, 'error', matchText)
            stop()
          }
          return
        }
        const previous = context.shift()
        if (this.closes[this.opens.indexOf(previous)] !== matchText) {
          this.view.add(editor, range, 'error', matchText)
          stop()
        }
        this.view.add(editor, range, max - context.length, matchText)
      }
    )
  },

  activate() {
    this.setDelimiters()
    this.view = new RainbowDelimitersView()
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(
      atom.workspace.observeTextEditors(editor => {
        this.subscriptions.add(
          editor.onDidChangeCursorPosition(({ cursor }) => {
            this.highlight(editor, cursor.getBufferPosition())
          }),
          editor.onDidChange(({ cursor }) => {
            this.highlight(editor, editor.getCursorBufferPosition())
          }),
          editor.onDidTokenize(() => {
            this.highlight(editor, editor.getCursorBufferPosition())
          })
        )
      }),
      atom.config.onDidChange('rainbow-delimiters.delimiters', () =>
        this.setDelimiters()
      )
    )
  },

  serialize() {},

  deactivate() {
    this.subscriptions.dispose()
    this.view.destroy()
  },
}
