import '@babel/polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import Main from './main'

window.addEventListener('DOMContentLoaded', (event) => {
  ReactDOM.render(<Main />, document.body);
})
