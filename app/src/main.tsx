import ReactDOM from 'react-dom/client'
import App from './App.js'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ChakraProvider, ColorModeScript, ThemeConfig, extendTheme } from '@chakra-ui/react'
import './index.css'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({ config })

const router = createBrowserRouter([{
  path: '*',
  element: <App />
}])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ColorModeScript initialColorMode={config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <RouterProvider router={router} />
    </ChakraProvider>
  </>
)