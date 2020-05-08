import PropTypes from 'prop-types'
import React from 'react'
import CDGraphics from 'cdgraphics'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('media')

class CDGPlayer extends React.Component {
  static propTypes = {
    alpha: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    mediaId: PropTypes.number.isRequired,
    mediaKey: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    onAudioElement: PropTypes.func.isRequired,
    // media events
    onEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  canvas = React.createRef()
  audio = React.createRef()
  state = { CDGBackgroundColor: null }

  componentDidMount () {
    this.cdg = new CDGraphics(this.canvas.current, {
      forceTransparent: true,
      onBackgroundChange: this.handleCDGBackgroundChange,
    })

    this.props.onAudioElement(this.audio.current)
    this.props.onStatus({ isAlphaSupported: true })
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.mediaKey !== this.props.mediaKey) {
      this.updateSources()
      return
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }
  }

  render () {
    const { alpha, width, height } = this.props
    const style = {
      backgroundColor: 'transparent',
    }

    if (this.state.CDGBackgroundColor) {
      const [r, g, b, a] = this.state.CDGBackgroundColor // eslint-disable-line no-unused-vars
      style.backgroundColor = `rgba(${r},${g},${b},${alpha})`
    }

    // cd graphics are chunky; scale to a max of 80% viewport height
    const vMaxScale = Math.floor((height * 0.8) / 216)
    const hMaxScale = Math.floor(width / 300)
    const scale = Math.min(vMaxScale, hMaxScale)

    return (
      <div style={style}>
        <canvas
          width={scale * 300}
          height={scale * 216}
          ref={this.canvas}
        />
        <br />
        <audio
          preload='auto'
          onCanPlayThrough={this.updateIsPlaying}
          onEnded={this.props.onEnd}
          onError={this.handleError}
          onLoadStart={this.props.onLoad}
          onPause={this.handlePause}
          onPlay={this.handlePlay}
          onTimeUpdate={this.handleTimeUpdate}
          ref={this.audio}
        />
      </div>
    )
  }

  updateSources = () => {
    this.audio.current.pause()

    // load .cdg file
    api('GET', `/${this.props.mediaId}?type=cdg`)
      .then(res => res.arrayBuffer())
      .then(res => {
        this.cdg.load(new Uint8Array(res))

        // start loading audio
        this.audio.current.src = `/api/media/${this.props.mediaId}?type=audio`
        this.audio.current.load()
      }).catch(err => {
        this.props.onError(err.message)
      })
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.audio.current.play()
        .then(() => this.props.onPlay())
        .catch(err => this.props.onError(err.message))
    } else {
      this.audio.current.pause()
    }
  }

  handleCDGBackgroundChange = color => {
    this.setState({ CDGBackgroundColor: color })
  }

  /*
  * <audio> event handlers
  */
  handleError = (el) => {
    const { message, code } = el.target.error
    this.props.onError(`${message} (code ${code})`)
  }

  handlePause = () => this.cdg.pause()
  handlePlay = () => this.cdg.play()

  handleTimeUpdate = () => {
    this.cdg.sync(this.audio.current.currentTime * 1000)

    this.props.onStatus({
      position: this.audio.current.currentTime,
    })
  }
}

export default CDGPlayer
