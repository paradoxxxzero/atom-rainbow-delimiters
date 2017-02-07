'use babel';

export default class RainbowDelimitersView {

  constructor(serializedState) {
    this.markers = []
  }

  serialize() {}

  destroy() {
    this.markers.map(marker => marker.destroy())
  }

  add(editor, range, type, char='none') {
    let marker = editor.markBufferRange(range)
    editor.decorateMarker(
      marker, { type: 'highlight', class: `rainbow rainbow-${ type } rainbow-${char}` })
    this.markers.push(marker)
  }
}
