import React, { useState } from 'react'
import Header from './Header';

const Layout = ({children}) => {
    const [theme,setTheme]= useState('light');

  return (
    <div>

        <Header/>
    </div>
  )
}

export default Layout