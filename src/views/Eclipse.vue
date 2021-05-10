<template>
  <div>
    <h1>Eclipse SETUP</h1>
    <button @click="selectDirectory($event)">Eclipse folder</button>
    <div class="info" v-show="state.folder || state.error || state.lombokAgentAdded">
      <transition name="slide-fade">
        <div v-if="state.folder">{{ state.folder }}</div>
      </transition>
      <transition name="slide-fade">
        <div class="error" v-if="state.error">{{ state.error }}</div>
      </transition>
      <transition-group name="slide-fade" tag="ul">
        <li v-if="state.lombokAgentAdded">Patched with Lombok</li>
      </transition-group>
    </div>
    <button @click="patchEclipseWithLombok" v-if="!state.lombokAgentAdded" :disabled="!state.folder || state.error">
      Patch Eclipse with Lombok
    </button>
  </div>
</template>

<script>
import { state } from '@/store/eclipse-setup-store'
import { selectFolder, getStatic } from '@/utils/helper'
import fs from 'fs'
import path from 'path'

export default {
  name: 'Eclipse',

  setup() {
    function selectDirectory(event) {
      const button = event.target
      button.disabled = true
      const selectedFolder = selectFolder(state.folder)
      state.error = null
      if (selectedFolder) {
        state.folder = selectedFolder
        state.lombokAgentAdded = false
        if (!fs.existsSync(state.folder + '/eclipse.ini')) {
          state.error = 'No such ECLIPSE folder'
        }
      }
      button.disabled = false
    }

    function patchEclipseWithLombok(event) {
      const button = event.target
      button.disabled = true
      const targetPath = state.folder

      const lombokFile = getStatic('lombok-1.18.4.jar')

      console.log(`copy '${path.basename(lombokFile)}' to eclipse folder`)
      fs.copyFileSync(lombokFile, targetPath + '/lombok.jar')

      const eclipseFile = targetPath + '/eclipse.ini'
      let data = fs.readFileSync(eclipseFile, 'utf8')
      if (data.indexOf('lombok.jar') == -1) {
        data = data.replace(/\s*$/, '')
        data = data + '\n-javaagent:' + targetPath + path.sep + 'lombok.jar'
        console.log('lombok agent added in eclipse.ini file')
        fs.writeFileSync(eclipseFile, data)
      }
      state.lombokAgentAdded = true
      button.disabled = false
    }

    return { state, selectDirectory, patchEclipseWithLombok }
  },
}
</script>
