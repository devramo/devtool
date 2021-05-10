import { reactive } from 'vue'

export const state = reactive({
  folder: null,
  error: null,
  consoleLogsActivated: null,
  count: null,
  svnFolders: [],
  log4j2Files: [],
  svnClientFound: null,
  svnIgnoreDone: false,
  changes: {},
})
