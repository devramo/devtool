<template>
  <div>
    <h1>WILDFLY SETUP</h1>
    <a href="https://download.jboss.org/wildfly/19.1.0.Final/wildfly-19.1.0.Final.zip">DOWNLOAD wildfly-19.1.0.Final</a>
    <button @click="selectDirectory($event)">WILDFLY folder</button>

    <div class="info" v-show="state.folder || state.error || state.moduleAdded || state.configAdded">
      <transition name="slide-fade">
        <div v-if="state.folder">{{ state.folder }}</div>
      </transition>
      <transition name="slide-fade">
        <div class="error" v-if="state.error">{{ state.error }}</div>
      </transition>
      <transition-group name="slide-fade" tag="ul">
        <li v-if="state.moduleAdded">Modules added</li>
        <li v-if="state.configAdded">Configuration added in 'wipo-standalone-full.xml'</li>
      </transition-group>
    </div>
    <button @click="addModules($event)" :disabled="!state.folder || state.error || state.moduleAdded">
      Add Oracle UCP module
    </button>
    <button
      @click="configWildfly($event)"
      :disabled="!state.folder || state.error || state.configAdded"
      title="Based on an unchanged 'standalone-full.xml' file"
    >
      Add ePCT configuration <spinner v-if="waiting" />
    </button>
  </div>
</template>

<script>
import admZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import { state } from '@/store/wildfy-setup-store'
import { getStatic, selectFolder, executeCommand } from '@/utils/helper'
import { ref } from 'vue'
import Spinner from '@/components/Spinner.vue'

export default {
  name: 'Wildfy',
  components: { Spinner },
  setup() {
    const waiting = ref(false)

    function selectDirectory(event) {
      const button = event.target
      button.disabled = true
      const selectedFolder = selectFolder(state.folder)
      state.error = null
      if (selectedFolder) {
        state.folder = selectedFolder
        state.moduleAdded = false
        state.configAdded = false
        if (!fs.existsSync(state.folder + '/modules')) {
          state.error = 'No such WILDFLY folder'
        }
      }
      button.disabled = false
    }

    function addModules(event) {
      const button = event.target
      button.disabled = true
      const targetPath = state.folder + '/modules'
      const zipFilePath = getStatic('modules-to-add.zip')

      if (fs.existsSync(targetPath)) {
        console.log(`extract '${path.basename(zipFilePath)}' to: ${targetPath}`)
        const zip = new admZip(zipFilePath)
        zip.extractAllTo(/*target path*/ targetPath, /*overwrite*/ true)
        state.moduleAdded = true
      }
      button.disabled = false
    }

    async function configWildfly(event) {
      const button = event.target
      button.disabled = true
      state.error = null

      const targetPath = state.folder + '/standalone/configuration'
      if (fs.existsSync(targetPath + '/wipo-standalone-full.xml')) {
        fs.renameSync(
          targetPath + '/wipo-standalone-full.xml',
          targetPath + '/wipo-standalone-full-' + Date.now() + '.xml'
        )
      }
      if (fs.existsSync(targetPath + '/standalone-full.xml')) {
        fs.copyFileSync(targetPath + '/standalone-full.xml', targetPath + '/wipo-standalone-full.xml')
      } else {
        state.error = "Can't find standalone.xml file in WILDFLY standalone configuration folder"
      }
      const embededSeverScript = getStatic('embed-server-script.txt')
      const cmd = `jboss-cli --file=${embededSeverScript}`
      const cwd = state.folder + '/bin'

      waiting.value = true
      executeCommand(cmd, { cwd }, ({ error }) => {
        state.error = error
        button.disabled = false
        waiting.value = false
        if (!state.error) {
          state.configAdded = true
        }
      })
    }

    return {
      state,
      selectDirectory,
      addModules,
      configWildfly,
      executeCommand,
      waiting,
    }
  },
}
</script>
