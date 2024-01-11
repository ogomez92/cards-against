/* eslint-disable prettier/prettier */
import React from 'react'

const bgmap = {
  white: 'white',
  black: '#333'
}

const colormap = {
  white: '#333',
  black: 'white'
}

export default function GameCard({
  as: Base = 'div',
  type = 'white',
  text = '',
  className = '',
  br = 'rounded-xl',
  style = {},
  badge,
  ...props
}) {
  const bg = bgmap[type]
  const color = colormap[type]
  const showBadge = type === 'black' ? badge > 1 : !!badge

  return (
    <Base
      style={{ backgroundColor: bg, ...style }}
      className={`${className} relative hover:shadow-lg flex justify-start items-start ${br} w-52 h-52 p-3`}
      {...props}
    >
      <div
      aria-label={text.replaceAll('_', '(blanco)')}
      style={{ color }} className="font-semibold">
        {text}
      </div>
      {showBadge && (
        <span className="absolute bottom-2 right-2 block font-medium w-6 text-center rounded-full bg-white text-gray-900">
          {badge}
        </span>
      )}
    </Base>
  )
}
