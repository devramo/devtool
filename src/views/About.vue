<template>
  <div>
    <h1>DEVTOOL</h1>
    <h2>Version 1.0</h2>
    <h4>Configuration files used:</h4>
    <a :href="embededServerScriptFile" download="embed-server-script.txt">Wildfly configuration script</a>
    <span><a :href="lombokJarFile">Lombok JAR to patch Eclipse</a> (allowing lombok project compilation)</span>
    <a :href="oracleUcpModuleZipFile">Oracle UCP module</a>
    <a :href="oidcFilePath">OIDC configuration files</a>
    <a :href="tomcatConfigFile" download="tomcat-config.txt">Tomcat configuration</a>
    <br />
    <br />
    <button @click="openDebugTools">Open debug tools</button>
  </div>
</template>
<script>
import { getStatic } from '@/utils/helper'
import { ipcRenderer } from 'electron'

export default {
  setup() {
    const embededServerScriptFile = getStatic('embed-server-script.txt')
    const lombokJarFile = getStatic('lombok-1.18.4.jar')
    const oracleUcpModuleZipFile = getStatic('modules-to-add.zip')
    const oidcFilePath = getStatic('oidc-config-files.zip')
    const tomcatConfigFile = getStatic('tomcat-config.txt')

    const openDebugTools = () => {
      ipcRenderer.send('open-devtools')
    }

    return {
      embededServerScriptFile,
      lombokJarFile,
      oracleUcpModuleZipFile,
      oidcFilePath,
      tomcatConfigFile,
      openDebugTools,
    }
  },
}
</script>
