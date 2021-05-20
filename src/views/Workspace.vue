<template>
  <div>
    <h1>WORKSPACE LOGS &amp; SVN SETUP</h1>
    <button @click="selectDirectory($event)">Workspace or Project folder</button>
    <div class="info" v-show="state.folder">
      <transition-group name="slide-fade">
        <div v-if="state.folder">{{ state.folder }}</div>
      </transition-group>
    </div>

    <div v-if="state.folder" style="margin-top: 1rem">
      <button @click="toggle($event)" v-if="state.log4j2Files.length">
        {{ state.consoleLogsActivated ? 'Desactivate' : 'Activate' }} all ({{ state.log4j2Files.length }}) console logs
        <spinner class="spinner" />
      </button>
    </div>
    <div class="info" v-show="state.consoleLogsActivated && state.log4j2Files.length">
      <transition-group name="slide-fade" tag="ul">
        <li v-if="state.consoleLogsActivated && state.log4j2Files.length">
          Console logs activated in all "log4j2.xml" files
        </li>
      </transition-group>
    </div>

    <div v-if="state.folder && state.svnFolders.length">
      <div class="info" style="margin-top: 1rem">
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
      <div>
        <button
          v-if="!state.svnIgnoreDone"
          @click="changeSvnIgnore($event)"
          title="Add log4j2.xml in SVN global ignore list + add target, .project, .classpath, .settings to SVN ignore list"
        >
          Set SVN ignore list
          <spinner class="spinner" />
        </button>
        <transition-group name="fade" v-show="state.svnClientFound" tag="div" mode="out-in">
          <div class="info" v-if="state.svnIgnoreDone">
            <div v-if="Object.keys(state.changes).length">
              SVN changes added:<br />
              <code>
                <pre>{{ state.changes }}</pre>
              </code>
            </div>
            <div v-else>
              Nothing to do: target, .project, .classpath, .settings and log4j2.xml are already ignored by SVN.
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script>
import { state } from '@/store/workspace-setup-store'
import { selectFolder, executeCommand, getOS } from '@/utils/helper'
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

      const activated = state.consoleLogsActivated
      state.log4j2Files.forEach(file => {
        fs.readFile(file, 'utf8', function (err, data) {
          if (err) {
            return console.log(err)
          }
          let result
          if (activated) {
            result = data.replace(
              /^(\s*)<AppenderRef\s*ref\s*=\s*"console"\s*\/>(\s*)$/,
              '$1<!-- <AppenderRef ref="console" /> -->$2'
            )
          } else {
            result = data.replace(
              /^(\s*)<!--\s*<AppenderRef\s*ref\s*=\s*"console"\s*\/>\s*-->(\s*)$/,
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
      const SVN_IGNORE = 'svn:ignore'
      const SVN_GLOBAL_IGNORES = 'svn:global-ignores'
      const WINDOWS_OS = !!getOS().match(/win/i)
      const ECHO_EMPTY_LINE = WINDOWS_OS ? 'echo.' : 'echo ""'
      let button = event.target
      button.disabled = true
      let i = 0
      state.svnFolders.forEach(svnFolder => {
        let cmd = 'svn proplist -v'
        let lastPropertiesKey
        let svnProperties
        executeCommand(cmd, { cwd: svnFolder }, ({ error, output }) => {
          error && (state.error = error)

          if (!state.error) {
            console.log('output', output)
            svnProperties = output
              .split(/(\r|\n)+/)
              .map(e => e.trim())
              .filter(e => e && !e.match(/Properties on/))
              .reduce((total, num) => {
                if (num.match(/svn:/)) {
                  total[num] = []
                  lastPropertiesKey = num
                } else total[lastPropertiesKey].push(num)
                return total
              }, {})

            // svn:global-ignores
            const globalIgnoreList = svnProperties[SVN_GLOBAL_IGNORES] ?? []
            if (globalIgnoreList.indexOf('log4j2.xml') == -1) {
              let cmd = (cmd = `svn propedit svn:global-ignores ${svnFolder} --editor-cmd "(${ECHO_EMPTY_LINE} && echo "log4j2.xml") ${
                globalIgnoreList.length ? '>>' : '>'
              }"`)
              executeCommand(cmd, { cwd: svnFolder }, ({ error }) => {
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

            // svn:ignore
            const ignoredList = svnProperties[SVN_IGNORE] ?? []
            const notAddedYetList = IGNORED_SVN_LIST.filter(v => ignoredList.indexOf(v) === -1)
            if (notAddedYetList.length) {
              cmd = `svn propedit svn:ignore ${svnFolder} --editor-cmd "(${
                ignoredList.length && notAddedYetList.length ? `${ECHO_EMPTY_LINE} && ` : ''
              }${notAddedYetList.map(v => 'echo ' + v).join(` && ${ECHO_EMPTY_LINE} && `)}) ${
                ignoredList.length ? '>>' : '>'
              }"`
              executeCommand(cmd, { cwd: svnFolder }, ({ error }) => {
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
