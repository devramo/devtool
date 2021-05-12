import { ipcRenderer, remote } from 'electron'
import { exec } from 'child_process'
import path from 'path'

const isBuild = process.env.NODE_ENV === 'production'

let __static
ipcRenderer.on('static-path', (event, staticPath) => {
  __static = staticPath
})

export const getStatic = file => {
  return path.join(isBuild ? __dirname : __static, '../extraResources', file)
}

export const selectFolder = defaultPath => {
  if (!defaultPath) {
    defaultPath = '.'
  }
  const path = remote.dialog.showOpenDialogSync({
    properties: ['openDirectory'],
    defaultPath,
  })
  if (path) return path[0]
}

export const executeCommand = (cmd, options = {}, callback = () => {}) => {
  let error
  let output
  console.log(cmd)
  options && console.log(options['cwd'])
  const childProcess = exec(cmd, options)
  childProcess.stdout.on('data', data => {
    // console.log(`stdout: ${data}`)
    output = data
  })
  childProcess.stderr.on('data', data => {
    // console.error(`stderr: ${data}`)
    error = data
  })

  // In case of message: press key to continue
  childProcess.stdin.setEncoding('utf-8')
  childProcess.stdin.write(' ')
  childProcess.stdin.end()

  childProcess.on('exit', () => {
    callback({ error, output })
  })
}
