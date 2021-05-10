<template>
  <div>
    <h1>WORKSPACE LOGS &amp; SVN SETUP</h1>
    <button @click="selectDirectory($event)">Workspace or Project folder</button>
    <div class="info" v-show="state.folder">
      <transition-group name="slide-fade">
        <div v-if="state.folder">{{ state.folder }}</div>
      </transition-group>
    </div>

    <transition-group name="fade" v-if="state.folder && !state.error">
      <button @click="toggle($event)" v-if="state.log4j2Files.length">
        {{ state.consoleLogsActivated ? 'Desactivate' : 'Activate' }} all ({{ state.log4j2Files.length }}) console logs
        <spinner class="spinner" />
      </button>
    </transition-group>
    <div class="info" v-show="state.consoleLogsActivated && state.log4j2Files.length">
      <transition-group name="slide-fade" tag="ul">
        <li v-if="state.consoleLogsActivated && state.log4j2Files.length">
          Console logs activated in all "log4j2.xml" files
        </li>
      </transition-group>
    </div>

    <div v-if="state.folder && !state.error && state.svnFolders.length">
      <div class="info">
        <transition-group name="slide-fade">
          <div class="error" v-if="state.error">{{ state.error }}</div>
          <div class="error" v-if="!state.svnClientFound">
            SVN client not found<br />Please
            <a href="https://www.collab.net/downloads/subversion" target="_blank">download one here</a>, install it, and
            restart the application.
          </div>
        </transition-group>
        <transition name="fade">
          <div v-if="state.svnFolders.length" class="svn-folders">
            SVN {{ state.svnFolders.length > 1 ? 'Folders:' : 'Folder:' }}
            <span v-for="(folder, index) in state.svnFolders" :key="index">
              {{ basename(folder) }}<span class="sep">, </span>
            </span>
          </div>
        </transition>
      </div>
      <div v-if="state.svnClientFound && !state.svnIgnoreDone">
        <button
          @click="changeSvnIgnore($event)"
          title="Add log4j2.xml in SVN global ignore list + add target, .project, .classpath, .settings to SVN ignore list"
        >
          Set SVN ignore list
          <spinner class="spinner" />
        </button>
      </div>
    </div>
    <code v-if="state.svnIgnoreDone && Object.keys(state.changes).length">
      <pre>{{ state.changes }}</pre>
    </code>
    <hr />
    {{ state.changes }}
  </div>
</template>

<script>
import { state } from '@/store/workspace-setup-store'
import { selectFolder, executeCommand } from '@/utils/helper'
import fs from 'fs'
import path from 'path'
import findit from 'findit'
import Spinner from '../components/Spinner.vue'
import { onMounted } from 'vue'

const IGNORED_SVN_LIST = ['.settings', 'target', '.project', '.classpath']

export default {
  components: { Spinner },
  name: 'Workspace',

  setup() {
    function checkSvnClient() {
      executeCommand('svn --version --quiet', null, ({ error }) => {
        if (error) {
          state.svnClientFound = false
          return
        }
        state.svnClientFound = true
      })
    }
    onMounted(() => {
      checkSvnClient()
    })

    function basename(folder) {
      return path.basename(folder)
    }
    function existConsoleLogDesactivated() {
      if (state.folder) {
        if (state.consoleLogsActivated === null) {
          state.consoleLogsActivated = true
          const finder = findit(state.folder)
          finder.on('directory', function (dir, stat, stop) {
            const dirname = path.basename(dir)
            if (dirname[0] === '.') {
              if (dirname === '.svn') {
                state.svnFolders.push(path.dirname(dir))
              }
              stop()
            }
          })
          finder.on('file', file => {
            const filename = path.basename(file)
            if (filename === 'log4j2.xml') {
              state.log4j2Files.push(file)
              if (state.consoleLogsActivated === null) {
                fs.readFile(file, 'utf8', function (err, data) {
                  if (err) {
                    return console.log(err)
                  }

                  const found = data.match(/<!--\s*<AppenderRef\s*ref\s*=\s*"console"\s*\/>\s*-->/)
                  if (found) {
                    console.log('console logs desactivated for:', file)
                    state.consoleLogsActivated = false
                  }
                })
              }
            }
          })
          finder.on('end', () => {})
        }
      }
    }

    function selectDirectory(event) {
      const button = event.target
      button.disabled = true
      const selectedFolder = selectFolder(state.folder)
      state.error = null
      if (selectedFolder) {
        state.folder = selectedFolder
        state.consoleLogsActivated = null
        state.svnFolders = []
        state.log4j2Files = []
        state.svnIgnoreDone = false
        state.changes = {}
        existConsoleLogDesactivated()
      }
      button.disabled = false
    }

    function toggle(event) {
      const button = event.target
      button.disabled = true

      state.log4j2Files.forEach(file => {
        fs.readFile(file, 'utf8', function (err, data) {
          if (err) {
            return console.log(err)
          }
          let result
          if (state.consoleLogsActivated) {
            result = data.replace(
              /(\s*)<AppenderRef\s*ref\s*=\s*"console"\s*\/>(\s*)/,
              '$1<!-- <AppenderRef ref="console" /> -->$2'
            )
          } else {
            result = data.replace(
              /(\s*)<!--\s*<AppenderRef\s*ref\s*=\s*"console"\s*\/>\s*-->(\s*)/,
              '$1<AppenderRef ref="console" />$2'
            )
          }
          fs.writeFile(file, result, 'utf8', function (err) {
            if (err) return console.log(err)
          })
        })
      })
      state.consoleLogsActivated = !state.consoleLogsActivated
      button.disabled = false
    }

    function changeSvnIgnore(event) {
      let button = event.target
      button.disabled = true
      let i = 0
      state.svnFolders.forEach(svnFolder => {
        let cmd = 'svn propget svn:global-ignores'
        executeCommand(cmd, { cwd: state.folder }, ({ error, output }) => {
          error && (state.error = error)

          if (!state.error) {
            if (output.indexOf('log4j2.xml') == -1) {
              let cmd = `svn propset svn:global-ignores "log4j2.xml" ${svnFolder}`
              console.log(cmd)
              executeCommand(cmd, { cwd: state.folder }, ({ error }) => {
                if (error) {
                  state.error = error
                  return
                }

                if (!state.changes[basename(svnFolder)]) {
                  state.changes[basename(svnFolder)] = {}
                }
                state.changes[basename(svnFolder)]['global-ignores'] = ['log4j2.xml']
              })
            }
          }
        })

        if (!state.error) {
          cmd = 'svn propget svn:ignore'
          executeCommand(cmd, { cwd: state.folder }, ({ error, output }) => {
            error && (state.error = error)
            if (!state.error) {
              const ignoredList = output.split(/\s+/)
              const notAddedYetList = IGNORED_SVN_LIST.filter(v => ignoredList.indexOf(v) === -1)
              if (notAddedYetList.length) {
                cmd = `svn propedit svn:ignore ${svnFolder} --editor-cmd "(${notAddedYetList
                  .map(v => 'echo ' + v)
                  .join(' & ')}) >>"`
                console.log(cmd)
                executeCommand(cmd, { cwd: state.folder }, ({ error }) => {
                  i++
                  if (i >= state.svnFolders.length) {
                    button.disabled = false
                    state.svnIgnoreDone = true
                  }
                  if (error) {
                    state.error = error
                    return
                  }
                  if (!state.changes[basename(svnFolder)]) {
                    state.changes[basename(svnFolder)] = {}
                  }
                  state.changes[basename(svnFolder)].ignore = notAddedYetList
                })
              } else {
                i++
                if (i >= state.svnFolders.length) {
                  button.disabled = false
                  state.svnIgnoreDone = true
                }
              }
            }
          })
        }

        console.log(`SVN folder: "${svnFolder}`)
      })
    }

    return { state, selectDirectory, toggle, changeSvnIgnore, basename }
  },
}
</script>
<style scoped>
.svn-folders span:last-child .sep {
  display: none;
}
button .spinner {
  display: none;
}
button:disabled .spinner {
  display: inline-block;
}
</style>
