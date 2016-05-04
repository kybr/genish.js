'use strict'

let gen = require( './gen.js' ),
    data = require( './data.js' )

let isStereo = false

let utilities = {
  ctx: null,

  clear() {
    this.callback = () => 0
  },

  createContext() {
    this.ctx = new ( AudioContext || webkitAudioContext )()
    
    return this
  },

  createScriptProcessor() {
    this.node = this.ctx.createScriptProcessor( 2048, 0, 2 ),
    this.clearFunction = function() { return 0 },
    this.callback = this.clearFunction

    this.node.onaudioprocess = function( audioProcessingEvent ) {
      var outputBuffer = audioProcessingEvent.outputBuffer;

      var left = outputBuffer.getChannelData( 0 ),
          right= outputBuffer.getChannelData( 1 )

      for (var sample = 0; sample < left.length; sample++) {
        if( !isStereo ) {
          left[ sample ] = right[ sample ] = utilities.callback()
        }else{
          var out = utilities.callback()
          left[ sample  ] = out[0]
          right[ sample ] = out[1]
        }
      }
    }

    this.node.connect( this.ctx.destination )

    return this
  },

  playGraph( graph, debug ) {
    if( debug === undefined ) debug = false
          
    isStereo = Array.isArray( graph )

    utilities.callback = gen.createCallback( graph, debug )
    
    if( utilities.console ) utilities.console.setValue( utilities.callback.toString() )
  },

  loadSample( soundFilePath, data ) {
    let req = new XMLHttpRequest()
    req.open( 'GET', soundFilePath, true )
    req.responseType = 'arraybuffer' 
    
    let promise = new Promise( (resolve,reject) => {
      req.onload = function() {
        var audioData = req.response

        utilities.ctx.decodeAudioData( audioData, (buffer) => {
          data.buffer = buffer.getChannelData(0)
          resolve( data.buffer )
        })
      }
    })

    req.send()

    return promise
  }

}

module.exports = utilities