<template>
  <div>
    <h1>WORKSPACE LOGS &amp; SVN SETUP</h1>
    <button @click="selectDirectory($event)">Workspace or Project folder</button>
    <div class="info">
      <transition-group name="slide-fade">
        <div v-if="state.folder">{{ state.folder }}</div>
        <div v-if="log4j2Files.length">{{ log4j2Files.length }} log4j2.xml found</div>
        <div v-if="svnFolders.length" class="svn-folders">
          SVN {{ svnFolders.length > 1 ? 'Folders:' : 'Folder:' }}
          <span v-for="(folder, index) in svnFolders" :key="index">
            {{ basename(folder) }}<span class="sep">,</span>
          </span>
        </div>
      </transition-group>
      <transition-group name="slide-fade" tag="ul">
        <li v-if="state.consoleLogsActivated">Console logs activated in all "log4j2.xml" files</li>
      </transition-group>
    </div>

    <transition-group name="fade" v-if="state.folder && !state.error">
      <button @click="toggle($event)" v-if="log4j2Files.length">
        {{ state.consoleLogsActivated ? 'Desactivate' : 'Activate' }} all console logs <spinner class="spinner" />
      </button>
    </transition-group>

    <div v-if="state.folder && !state.error && svnFolders.length">
      <div class="info">
        <transition-group name="slide-fade">
          <div class="error" v-if="state.error">{{ state.error }}</div>
          <div class="error" v-if="!svnClientFound">
            SVN client not found<br />Please
            <a href="https://www.collab.net/downloads/subversion" target="_blank">download one here</a>, install it, and
            restart the application.
          </div>
        </transition-group>
      </div>
      <div v-if="svnClientFound">
        <button
          @click="changeSvnIgnore($event)"
          title="Add log4j2.xml in SVN global ignore list + add target, .project, .classpath, .settings to SVN ignore list"
        >
          Set SVN ignore list
          <spinner class="spinner" />
        </button>
        <div class="info">
          If you get issue when commiting one of the following file or folder: target, .project, .classpath,
          .settings<br /><br />

          With Eclipse subversion:
          <ol>
            <li>Update your project (the working copy) to the head revision.</li>
            <li>Recreate the file in Eclipse.</li>
            <li>Set svn:ignore on the file via Team->Add to svn:ignore.</li>
            <li>Restart eclipse to reflect changes.</li>
          </ol>
          With Tortoise SVN:
          <ol>
            <li>TortiseSVN -> Delete and add to ignore list</li>
            <li>Close then re-open the project in Eclipse</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { state } from '@/store/workspace-setup-store'
import { selectFolder, executeCommand, getStatic } from '@/utils/helper'
import fs from 'fs'
import path from 'path'
import { ref } from 'vue'
import findit from 'findit'
import Spinner from '../components/Spinner.vue'
import { onMounted } from 'vue'

export default {
  components: { Spinner },
  name: 'Workspace',

  setup() {
    const svnFolders = ref([])
    const log4j2Files = ref([])
    const svnClientFound = ref(null)

    function checkSvnClient() {
      executeCommand('svn --version --quiet', null, ({ error }) => {
        if (error) {
          svnClientFound.value = false
          return
        }
        svnClientFound.value = true
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
                svnFolders.value.push(path.dirname(dir))
              }
              stop()
            }
          })
          finder.on('file', file => {
            const filename = path.basename(file)
            if (filename === 'log4j2.xml') {
              log4j2Files.value.push(file)
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
        existConsoleLogDesactivated()
      }
      button.disabled = false
    }

    function toggle(event) {
      const button = event.target
      button.disabled = true

      log4j2Files.value.forEach(file => {
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
      svnFolders.value.forEach(svnFolder => {
        const cmd = `svn propset svn:global-ignores "log4j2.xml" ${svnFolder}`
        executeCommand(cmd, { cwd: state.folder, env: { ...process.env } }, ({ error }) => {
          state.error = error
        })

        const svnIgnoreFilePath = getStatic('svn-ignore.txt')
        const cmd2 = `svn propset svn:ignore -F "${svnIgnoreFilePath}" ${svnFolder}`
        executeCommand(cmd2, { cwd: state.folder, env: { ...process.env } }, ({ error }) => {
          state.error = error
          i++
          if (i >= svnFolders.value.length) {
            button.disabled = false
          }
        })
        console.log(`SVN folder: "${svnFolder}`)
      })
    }

    return { state, selectDirectory, toggle, changeSvnIgnore, svnFolders, log4j2Files, basename, svnClientFound }
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
