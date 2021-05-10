<template>
  <div id="nav">
    <router-link :to="{ path: '/' }">Wildfly</router-link> |
    <router-link :to="{ path: '/tomcat' }">Tomcat</router-link> |
    <router-link :to="{ path: '/eclipse' }">Eclipse</router-link> |
    <router-link :to="{ path: '/workspace' }">Workspace</router-link> |
    <router-link :to="{ path: '/about' }">About</router-link>
  </div>
  <router-view class="content" />
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
body {
  background-color: #1f1f1f;
  color: #555;
  padding: 0;
  margin: 0;
  font-family: cursive;
}
button {
  background: #ccc;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.7rem;
  margin: 4px;
  outline: 0;
  width: 250px;
}
button:active {
  background: #555;
}
button:active,
button:focus,
button:hover {
  border: 1px solid #ddd;
}
a:focus,
a:active,
a:hover {
  color: #888;
}
a {
  color: #bbb;
  text-decoration: none;
  outline: 0;
  margin-bottom: 2px;
  display: inline-block;
}
#nav {
  padding: 1.2rem;
  text-align: center;
  background: #444;
  color: #999;
  position: sticky;
  top: 0;
}
#nav a {
  margin: 0 1rem;
  border-bottom-style: solid;
  border-bottom-width: 0;
  padding-bottom: 4px;
}
#nav a.router-link-active {
  border-bottom-width: 2px;
  color: #bbb;
}
#nav button {
  margin-left: 3rem;
  width: auto;
}
.info {
  font-family: monospace;
  color: #bbb;
  padding-left: 4px;
  display: inline-block;
  margin-block-start: 1rem;
  margin-block-end: 1rem;
}
.content {
  display: flex;
  flex-direction: column;
  margin: 0 2rem;
}
.content a {
  font-family: monospace;
  text-decoration: underline;
  margin: 4px;
  margin-bottom: 1rem;
}
.error {
  color: red;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
