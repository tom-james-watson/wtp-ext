import React from "react"
import PropTypes from 'prop-types'

NonIdealState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string
}

export default function NonIdealState({title, description}) {
  return (
    <div className="non-ideal-state">
      <h4>{title}</h4>
      <h5>{description}</h5>
    </div>
  )
}
