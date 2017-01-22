const mp3Duration = require('mp3-duration')

module.exports = exports = function(file) {
  return new Promise(function(resolve, reject) {
    mp3Duration(file, function(err, duration){
      if (err) { return reject(err) }
      return resolve(duration)
    })
  })
}