<template>
  <div>
    <h1>TOMCAT SETUP</h1>
    <a :href="oidcFilePath" title="to extract in the same folder defined in Tomcat config">Download DEV OIDC config</a>
    <div class="info" v-show="state.configCopied">
      <transition-group name="slide-fade" tag="ul" mode="out-in">
        <li v-if="state.configCopied">Configuration copied to clipboard</li>
      </transition-group>
    </div>
    <button @click="copyToClipboard">Copy Tomcat config to clipboard</button>
    <div class="info">
      <transition name="fade">
        <pre v-if="showConfig">{{ state.config }}</pre>
      </transition>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { state } from '@/store/tomcat-setup-store'
import { getStatic } from '@/utils/helper'
import { clipboard } from 'electron'
import fs from 'fs'
import path from 'path'

export default {
  name: 'Tomcat',

  setup() {
    const showConfig = ref(false)
    const oidcFilePath = getStatic('oidc-config-files.zip')

    state.configCopied = false
    if (!state.config) {
      const configFile = getStatic('tomcat-config.txt')
      console.log(`load '${path.basename(configFile)}'`)
      state.config = fs.readFileSync(configFile, 'utf8')
    }
    function copyToClipboard() {
      clipboard.writeText(state.config)
      setTimeout(() => {
        state.configCopied = false
      }, 3000)
      state.configCopied = true
    }

    setTimeout(() => {
      showConfig.value = true
    }, 100)
    return { state, copyToClipboard, showConfig, oidcFilePath }
  },
}
</script>
